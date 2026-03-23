# openclaw-deep-observability-tools

CLI tool for installing and managing [OpenClaw Deep Observability Plugin](https://github.com/bilbo-yu/openclaw-deep-observability-plugin).

## Installation

```bash
npm install -g openclaw-deep-observability-tools
```

## Quick Start

### Install the Plugin

Install and configure the OpenClaw Deep Observability Plugin:

```bash
# Interactive installation (recommended)
openclaw-deep-observability-tools install

# Non-interactive with custom endpoint
openclaw-deep-observability-tools install --endpoint http://your-otel-collector:4318 --non-interactive
```

### Update the Plugin

Update to the latest version:

```bash
openclaw-deep-observability-tools update
```

## Commands

### `install`

Install and configure OpenClaw Deep Observability Plugin.

```bash
openclaw-deep-observability-tools install [options]
```

### `update`

Update OpenClaw Deep Observability Plugin to a newer version.

```bash
openclaw-deep-observability-tools update [options]
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--version <version>` | Install or update to a specific version of the plugin | latest |
| `--endpoint <url>` | OTLP endpoint URL for sending telemetry data | `http://localhost:4318` |
| `--protocol <protocol>` | Protocol to use for telemetry export (`http/protobuf` or `grpc`) | `http/protobuf` |
| `--app <name>` | Application name for resource attribute `application.name` | `openclaw-{hostname}` |
| `--appid <id>` | Application ID for resource attribute `application.id` | auto-generated MD5 from app name |
| `--service <name>` | Service name for configuration | `openclaw-gateway` |
| `--capture-content` | Enable request/response content capture | `true` |
| `--no-capture-content` | Disable request/response content capture | - |
| `--non-interactive` | Skip interactive prompts and use default values | `false` |
| `--skip-version-check` | Skip OpenClaw version validation | `false` |
| `--debug` | Enable debug logging for troubleshooting | `false` |
| `-V, --cli-version` | Display the CLI version | - |
| `-h, --help` | Display help information | - |

## Examples

### Basic Installation

```bash
openclaw-deep-observability-tools install
```

### Install with Custom OTLP Endpoint

```bash
openclaw-deep-observability-tools install --endpoint http://otel-collector:4318
```

### Install with gRPC Protocol

```bash
openclaw-deep-observability-tools install --protocol grpc --endpoint http://otel-collector:4317
```

### Install Specific Version

```bash
openclaw-deep-observability-tools install --version 1.2.0
```

### Non-interactive Installation (for CI/CD)

```bash
openclaw-deep-observability-tools install \
  --endpoint http://otel-collector:4318 \
  --protocol http/protobuf \
  --non-interactive \
  --skip-version-check
```

### Install with Content Capture Disabled

```bash
openclaw-deep-observability-tools install --no-capture-content
```

### Update to Latest Version

```bash
openclaw-deep-observability-tools update
```

### Update with Debug Logging

```bash
openclaw-deep-observability-tools update --debug
```

### Install with Custom Application Identity

```bash
# Custom application name, ID, and service name
openclaw-deep-observability-tools install \
  --app my-custom-app \
  --appid my-custom-app-id \
  --service my-service

# Only specify application name (ID auto-generated)
openclaw-deep-observability-tools install --app my-app

# Custom service name with default application settings
openclaw-deep-observability-tools install --service my-gateway-service
```

## Configuration

The plugin configuration is stored in `~/.openclaw/openclaw.json`. When running `install` or `update` commands, existing configuration values are preserved unless explicitly overridden.

### Interactive Prompts

During interactive installation or update, you will be prompted for:

1. **OTLP Endpoint**: The URL of your OpenTelemetry collector
2. **Protocol**: Choose between `http/protobuf` or `grpc`
3. **Content Capture**: Enable or disable request/response body capture

If updating an existing installation, current values are shown as defaults - press Enter to keep them.

### Generated Configuration

The plugin automatically generates the following resource attributes:

| Attribute | Description | Example |
|-----------|-------------|---------|
| `application.name` | Application identifier based on hostname | `openclaw-myhost` |
| `application.id` | MD5 hash of application name | `a1b2c3d4e5f6...` |
| `service.id` | MD5 hash of `application.name\|service.name` | `f6e5d4c3b2a1...` |
| `instance.name` | Host machine IP address | `192.168.1.100` |

### Example Configuration File

```json
{
  "diagnostics": {
    "enabled": true
  },
  "plugins": {
    "allow": ["openclaw-deep-observability-plugin"],
    "entries": {
      "openclaw-deep-observability-plugin": {
        "enabled": true,
        "config": {
          "endpoint": "http://localhost:4318",
          "protocol": "http/protobuf",
          "serviceName": "openclaw-gateway",
          "captureContent": true,
          "resourceAttributes": {
            "application.name": "openclaw-myhost",
            "application.id": "a1b2c3d4e5f6789012345678901234ab",
            "service.id": "f6e5d4c3b2a109876543210987654321",
            "instance.name": "192.168.1.100"
          }
        }
      }
    }
  }
}
```

## License

MIT
