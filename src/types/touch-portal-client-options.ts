import { LoggingLevel } from './logging-level';

/**
 * Options for configuring the Touch Portal client.
 *
 * @property pluginId - (Optional) The unique identifier for the plugin.
 * @property captureRejections - (Optional) If true, promise rejections will be captured and handled.
 * @property logCallback - (Optional) A callback function for handling log messages, receiving the logging level and additional arguments.
 */
export type TouchPortalClientOptions = {
  pluginId?: string;
  captureRejections?: boolean;
  logCallback?: ((level: LoggingLevel, ...args: unknown[]) => void) | null;
};
