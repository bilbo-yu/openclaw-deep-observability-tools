#!/usr/bin/env node
import { Command } from 'commander';
import { installCommand } from './commands/install';
import { updateCommand } from './commands/update';
import { PROTOCOL_OPTIONS, Protocol } from './utils/constants';

const program = new Command();

program
  .name('openclaw-deep-observability-tools')
  .description('CLI for managing OpenClaw Deep Observability Plugin')
  .version('1.0.0', '-V, --cli-version');

program
  .command('install')
  .description('Install and configure OpenClaw Deep Observability Plugin')
  .option('--version <version>', 'Install a specific version of the plugin')
  .option('--endpoint <url>', 'OTLP endpoint URL (default: http://localhost:4318)')
  .option(
    '--protocol <protocol>',
    `Protocol to use (${PROTOCOL_OPTIONS.join(' or ')})`,
    'http/protobuf'
  )
  .option('--non-interactive', 'Skip interactive prompts and use defaults')
  .option('--skip-version-check', 'Skip OpenClaw version validation')
  .option('--debug', 'Enable debug logging')
  .option('--app <name>', 'Application name (default: openclaw-{hostname})')
  .option('--appid <id>', 'Application ID (default: auto-generated from app name)')
  .option('--service <name>', 'Service name (default: openclaw-gateway)')
  .action((options) => {
    installCommand({
      version: options.version,
      endpoint: options.endpoint,
      protocol: options.protocol as Protocol,
      nonInteractive: options.nonInteractive,
      skipVersionCheck: options.skipVersionCheck,
      debug: options.debug,
      app: options.app,
      appid: options.appid,
      service: options.service,
    });
  });

program
  .command('update')
  .description('Update OpenClaw Deep Observability Plugin')
  .option('--version <version>', 'Update to a specific version of the plugin')
  .option('--endpoint <url>', 'OTLP endpoint URL (default: http://localhost:4318)')
  .option(
    '--protocol <protocol>',
    `Protocol to use (${PROTOCOL_OPTIONS.join(' or ')})`,
    'http/protobuf'
  )
  .option('--non-interactive', 'Skip interactive prompts and use defaults')
  .option('--skip-version-check', 'Skip OpenClaw version validation')
  .option('--debug', 'Enable debug logging')
  .option('--app <name>', 'Application name (default: openclaw-{hostname})')
  .option('--appid <id>', 'Application ID (default: auto-generated from app name)')
  .option('--service <name>', 'Service name (default: openclaw-gateway)')
  .action(async (options) => {
    await updateCommand({
      version: options.version,
      endpoint: options.endpoint,
      protocol: options.protocol as Protocol,
      nonInteractive: options.nonInteractive,
      skipVersionCheck: options.skipVersionCheck,
      debug: options.debug,
      app: options.app,
      appid: options.appid,
      service: options.service,
    });
  });

program.parse(process.argv);