import { spawnSync, spawn } from 'child_process';
import * as os from 'os';

export function getPlatformCommand(command: string): string {
  const isWindows = os.platform() === 'win32';
  if (isWindows && command === 'npm') {
    return `${command}.cmd`;
  }
  return command;
}

export interface RunCommandOptions {
  cwd?: string;
  shell?: boolean;
}

export function runCommand(command: string, args: string[] = [], options: RunCommandOptions = {}): void {
  const isWindows = os.platform() === 'win32';
  try {
    const { status, error } = spawnSync(command, args, {
      stdio: 'inherit',
      cwd: options.cwd,
      shell: options.shell ?? isWindows,
    });

    if (error) {
      throw error;
    }
    if (status !== 0) {
      throw new Error(`Command failed with exit code ${status}`);
    }
  } catch (error) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

export function runCommandQuiet(
  command: string,
  args: string[] = [],
  options: RunCommandOptions = {}
): string {
  const isWindows = os.platform() === 'win32';
  try {
    const { stdout, error, status } = spawnSync(command, args, {
      encoding: 'utf-8',
      cwd: options.cwd,
      shell: options.shell ?? isWindows,
    });

    if (error) {
      throw error;
    }
    if (status !== 0) {
      throw new Error(`Command failed with exit code ${status}`);
    }
    return stdout.trim();
  } catch (error) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

export function spawnCommand(
  command: string,
  args: string[],
  options: RunCommandOptions = {}
): Promise<void> {
  const isWindows = os.platform() === 'win32';
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      cwd: options.cwd,
      shell: options.shell ?? isWindows,
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else if (code === null) {
        resolve(); // Signal killed
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}