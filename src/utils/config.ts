import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as crypto from 'crypto';
import { PLUGIN_ID, DEFAULT_CONFIG, Protocol } from './constants';

function getHostIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const nets = interfaces[name];
    if (nets) {
      for (const net of nets) {
        // Skip internal and non-IPv4 addresses
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  }
  return '127.0.0.1'; // Fallback
}

function md5(input: string): string {
  return crypto.createHash('md5').update(input).digest('hex');
}

export interface PluginConfig {
  endpoint: string;
  protocol: Protocol;
  serviceName: string;
  captureContent: boolean;
  resourceAttributes: {
    'application.name': string;
    'application.id': string;
    'service.id': string;
    'instance.name': string;
  };
}

export interface OpenClawConfig {
  diagnostics?: {
    enabled: boolean;
  };
  plugins?: {
    allow?: string[];
    entries?: {
      [key: string]: {
        enabled: boolean;
        config?: PluginConfig;
      };
    };
  };
}

export function getOpenClawDir(): string {
  return process.env.OPENCLAW_STATE_DIR || path.join(os.homedir(), '.openclaw');
}

export function getConfigPath(): string {
  return path.join(getOpenClawDir(), 'openclaw.json');
}

export function getExtensionsDir(): string {
  return path.join(getOpenClawDir(), 'extensions');
}

export async function readConfig(): Promise<OpenClawConfig> {
  const configPath = getConfigPath();
  if (await fs.pathExists(configPath)) {
    return fs.readJSON(configPath);
  }
  return {};
}

export async function writeConfig(config: OpenClawConfig): Promise<void> {
  const configPath = getConfigPath();
  await fs.ensureDir(path.dirname(configPath));
  await fs.writeJSON(configPath, config, { spaces: 2 });
}

export function getExistingPluginConfig(config: OpenClawConfig): { endpoint: string; protocol: Protocol; captureContent?: boolean } | undefined {
  const pluginConfig = config.plugins?.entries?.[PLUGIN_ID]?.config;
  if (pluginConfig?.endpoint && pluginConfig?.protocol) {
    return {
      endpoint: pluginConfig.endpoint,
      protocol: pluginConfig.protocol as Protocol,
      captureContent: pluginConfig.captureContent,
    };
  }
  return undefined;
}

export function createPluginConfig(
  endpoint: string,
  protocol: Protocol,
  captureContent: boolean = DEFAULT_CONFIG.captureContent,
  appName?: string,
  appId?: string,
  serviceName?: string
): PluginConfig {
  const hostname = os.hostname();
  const hostIp = getHostIp();
  const finalServiceName = serviceName || DEFAULT_CONFIG.serviceName;
  const applicationName = appName || `openclaw-${hostname}`;
  const applicationId = appId || md5(applicationName);
  const serviceId = md5(`${applicationName}|${finalServiceName}`);

  return {
    endpoint,
    protocol,
    serviceName: finalServiceName,
    captureContent,
    resourceAttributes: {
      'application.name': applicationName,
      'application.id': applicationId,
      'service.id': serviceId,
      'instance.name': hostIp,
    },
  };
}

export async function ensurePluginConfig(
  config: OpenClawConfig,
  endpoint: string = DEFAULT_CONFIG.endpoint,
  protocol: Protocol = DEFAULT_CONFIG.protocol,
  captureContent: boolean = DEFAULT_CONFIG.captureContent,
  appName?: string,
  appId?: string,
  serviceName?: string
): Promise<void> {
  // Ensure diagnostics is enabled
  if (!config.diagnostics) {
    config.diagnostics = { enabled: true };
  }
  config.diagnostics.enabled = true;

  // Ensure plugins structure exists
  if (!config.plugins) {
    config.plugins = {};
  }

  // Add to allow list
  if (!config.plugins.allow) {
    config.plugins.allow = [];
  }
  if (!config.plugins.allow.includes(PLUGIN_ID)) {
    config.plugins.allow.push(PLUGIN_ID);
  }

  // Ensure entries structure exists
  if (!config.plugins.entries) {
    config.plugins.entries = {};
  }

  // Set plugin entry with config
  config.plugins.entries[PLUGIN_ID] = {
    enabled: true,
    config: createPluginConfig(endpoint, protocol, captureContent, appName, appId, serviceName),
  };
}
