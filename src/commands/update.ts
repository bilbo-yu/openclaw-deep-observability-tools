import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { getPlatformCommand, runCommand } from '../utils/system';
import { readConfig, writeConfig, ensurePluginConfig, getExtensionsDir, getExistingPluginConfig } from '../utils/config';
import { PLUGIN_ID, PLUGIN_PACKAGE, Protocol } from '../utils/constants';
import {
  InstallOptions,
  checkOpenClawVersion,
  setNpmRegistry,
  getConfigFromOptions,
  verifyAndStart,
  isPluginInstalled,
} from '../utils/install-utils';

const EXTENSIONS_DIR = getExtensionsDir();
const PLUGIN_PATH = path.join(EXTENSIONS_DIR, PLUGIN_ID);

export async function updateCommand(options: InstallOptions = {}): Promise<void> {
  const openclawCmd = getPlatformCommand('openclaw');

  // Validate version format
  if (options.version && !/^[0-9a-zA-Z.\-+]+$/.test(options.version)) {
    console.error(chalk.red('Error: Invalid version format.'));
    process.exit(1);
  }

  // Check openclaw version
  checkOpenClawVersion(options.skipVersionCheck);

  // Check if plugin is installed
  if (!isPluginInstalled()) {
    console.error(chalk.red('Error: Plugin is not installed. Please run install command first.'));
    process.exit(1);
  }

  // Read existing config to preserve current values
  const existingOpenClawConfig = await readConfig();
  const existingPluginConfig = getExistingPluginConfig(existingOpenClawConfig);

  // Get configuration from user or use defaults (or keep existing)
  const { endpoint, protocol, captureContent } = await getConfigFromOptions(options, existingPluginConfig);

  // Set npm registry
  setNpmRegistry();

  // Update plugin using openclaw plugins update
  const spinner = ora('Updating plugin...').start();
  try {
    runCommand(openclawCmd, ['plugins', 'update', PLUGIN_ID]);
    spinner.succeed(chalk.green('Plugin updated successfully.'));
  } catch (error) {
    spinner.fail('Failed to update plugin.');
    console.error(error);
    process.exit(1);
  }

  // Configure plugin
  spinner.start('Configuring plugin...');
  try {
    const config = await readConfig();
    await ensurePluginConfig(config, endpoint, protocol, captureContent, options.app, options.appid, options.service);
    await writeConfig(config);
    spinner.succeed(chalk.green('Plugin configured successfully.'));
  } catch (error) {
    spinner.fail('Failed to configure plugin.');
    console.error(error);
    process.exit(1);
  }

  // Verify and start
  await verifyAndStart();

  console.log(chalk.green('\nUpdate complete!'));
  console.log(chalk.blue('Configuration:'));
  console.log(chalk.blue(`  Endpoint: ${endpoint}`));
  console.log(chalk.blue(`  Protocol: ${protocol}`));
  console.log(chalk.blue(`  Capture Content: ${captureContent}`));
}
