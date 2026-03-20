export const PLUGIN_ID = 'openclaw-deep-observability-plugin';
export const PLUGIN_PACKAGE = 'openclaw-deep-observability-plugin';

export const DEFAULT_CONFIG = {
  endpoint: 'http://localhost:4318',
  protocol: 'http/protobuf' as const,
  serviceName: 'openclaw-gateway',
  captureContent: true,
};

export const PROTOCOL_OPTIONS = ['http/protobuf', 'grpc'] as const;
export type Protocol = typeof PROTOCOL_OPTIONS[number];