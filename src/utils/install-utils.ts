import * as fs from 'fs-extra';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { getPlatformCommand, runCommand, runCommandQuiet } from './system';
import { getExtensionsDir } from './config';
import { PLUGIN_ID, DEFAULT_CONFIG, PROTOCOL_OPTIONS, Protocol } from './constants';

export interface InstallOptions {
  version?: string;
  endpoint?: string;
  protocol?: Protocol;
  captureContent?: boolean;
  nonInteractive?: boolean;
  skipVersionCheck?: boolean;
  debug?: boolean;
  app?: string;
  appid?: string;
  service?: string;
}

export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

export async function promptForConfig(
  defaultEndpoint: string = DEFAULT_CONFIG.endpoint,
  defaultProtocol: Protocol = DEFAULT_CONFIG.protocol,
  defaultCaptureContent: boolean = DEFAULT_CONFIG.captureContent
): Promise<{ endpoint: string; protocol: Protocol; captureContent: boolean }> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'endpoint',
      message: 'Enter the OTLP endpoint:',
      default: defaultEndpoint,
      validate: (input: string) => {
        if (!input.trim()) {
          return 'Endpoint cannot be empty';
        }
        try {
          new URL(input);
          return true;
        } catch {
          return 'Please enter a valid URL (e.g., http://localhost:4318)';
        }
      },
    },
    {
      type: 'list',
      name: 'protocol',
      message: 'Select the protocol:',
      choices: PROTOCOL_OPTIONS,
      default: defaultProtocol,
    },
    {
      type: 'confirm',
      name: 'captureContent',
      message: 'Enable request/response content capture?',
      default: defaultCaptureContent,
    },
  ]);

  return {
    endpoint: answers.endpoint,
    protocol: answers.protocol as Protocol,
    captureContent: answers.captureContent as boolean,
  };
}

export async function verifyAndStart(): Promise<void> {
  const openclawCmd = getPlatformCommand('openclaw');
  const spinner = ora('Restarting OpenClaw gateway...').start();

  try {
    runCommand(openclawCmd, ['gateway', 'restart']);
  } catch (error) {
    spinner.warn('Failed to restart OpenClaw gateway.');
  }

  // Wait for gateway to initialize
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Health check with retry
  let healthOk = false;
  for (let i = 0; i < 5; i++) {
    try {
      const healthOutput = runCommandQuiet(openclawCmd, ['health', '--json']);
      if (healthOutput) {
        const jsonMatch = healthOutput.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const health = JSON.parse(jsonMatch[0]);
          if (health && health.ok === true) {
            healthOk = true;
            break;
          }
        }
      }
    } catch (e) {
      // Ignore errors and retry
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  if (!healthOk) {
    spinner.warn('Health check failed after installation. The service might not be running correctly.');
  } else {
    spinner.succeed(chalk.green('OpenClaw is all set.'));
  }
}

export function checkOpenClawVersion(skipVersionCheck: boolean = false): void {
  if (skipVersionCheck) {
    console.warn(chalk.yellow('Warning: Skipping OpenClaw version check. Compatibility is not guaranteed.'));
    return;
  }

  const openclawCmd = getPlatformCommand('openclaw');
  try {
    const output = runCommandQuiet(openclawCmd, ['--version']);
    const versionMatch = output ? output.match(/(?:OpenClaw\s+)?(\d+\.\d+\.\d+)/) : null;
    const version = versionMatch ? versionMatch[1] : null;

    if (version && compareVersions(version, '2026.3.24') < 0) {
      console.error(
        chalk.red(
          `Error: OpenClaw version mismatch. Expected >= 2026.3.24, found ${version}. Please upgrade.`
        )
      );
      process.exit(1);
    } else if (!version) {
      console.warn(
        chalk.yellow(
          `Warning: Could not parse OpenClaw version from "${output}". Proceeding with installation but compatibility is not guaranteed.`
        )
      );
    }
  } catch (error) {
    console.error(chalk.red('Error: OpenClaw is not installed or not in PATH.'));
    process.exit(1);
  }
}

export function setNpmRegistry(): void {
  const spinner = ora('Setting up npm registry...').start();
  try {
    const npmCmd = getPlatformCommand('npm');
    runCommand(npmCmd, ['config', 'set', 'registry', 'https://registry.npmjs.org/']);
    spinner.succeed();
  } catch (e) {
    spinner.fail('Failed to set npm registry.');
    process.exit(1);
  }
}

export async function getConfigFromOptions(
  options: InstallOptions,
  existingConfig?: { endpoint: string; protocol: Protocol; captureContent?: boolean }
): Promise<{ endpoint: string; protocol: Protocol; captureContent: boolean }> {
  // Priority: command line options > existing config > defaults
  const defaultEndpoint = existingConfig?.endpoint || DEFAULT_CONFIG.endpoint;
  const defaultProtocol = existingConfig?.protocol || DEFAULT_CONFIG.protocol;
  const defaultCaptureContent = existingConfig?.captureContent ?? DEFAULT_CONFIG.captureContent;

  let endpoint = options.endpoint;
  let protocol = options.protocol;
  let captureContent = options.captureContent;

  if (options.nonInteractive) {
    // In non-interactive mode, use command line args or existing config or defaults
    endpoint = endpoint || existingConfig?.endpoint || DEFAULT_CONFIG.endpoint;
    protocol = protocol || existingConfig?.protocol || DEFAULT_CONFIG.protocol;
    captureContent = captureContent ?? existingConfig?.captureContent ?? DEFAULT_CONFIG.captureContent;
    console.log(chalk.blue(`Using configuration:`));
    console.log(chalk.blue(`  Endpoint: ${endpoint}`));
    console.log(chalk.blue(`  Protocol: ${protocol}`));
    console.log(chalk.blue(`  Capture Content: ${captureContent}`));
  } else {
    // In interactive mode, prompt with existing config as defaults
    const config = await promptForConfig(
      endpoint || defaultEndpoint,
      protocol || defaultProtocol,
      captureContent ?? defaultCaptureContent
    );
    endpoint = config.endpoint;
    protocol = config.protocol;
    captureContent = config.captureContent;
  }

  return { endpoint, protocol, captureContent };
}

export function isPluginInstalled(): boolean {
  const EXTENSIONS_DIR = getExtensionsDir();
  const PLUGIN_PATH = `${EXTENSIONS_DIR}/${PLUGIN_ID}`;
  return fs.pathExistsSync(PLUGIN_PATH);
}