/**
 * Options for connecting to the Touch Portal API.
 *
 * @property pluginId - (Optional) The unique identifier for the plugin. Used to identify the plugin instance when connecting.
 * @property exitOnClose - (Optional) If true, the process will exit when the connection is closed. Defaults to false.
 */
export type TouchPortalConnectOptions = {
  pluginId?: string;
  exitOnClose?: boolean;
};
