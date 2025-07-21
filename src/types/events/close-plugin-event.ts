/**
 * Touch Portal will send a message when it is closing the plugin for some reason.
 * Touch Portal will also try to close the process. This will happen approximately after 500 ms.
 * This will only happen if the process is being started through the entry.tp start command attribute.
 * This means that if this close call is received, be sure to properly shut down the plugin application/service otherwise it may be hard killed by Touch Portal.
 *
 * https://www.touch-portal.com/api/index.php?section=communication_listen_close_call
 *
 * @property type - The event type, always set to 'closePlugin'.
 * @property pluginId - The id of the plugin.
 */
export type CloseEvent = {
  type: 'closePlugin';
  pluginId: string;
};
