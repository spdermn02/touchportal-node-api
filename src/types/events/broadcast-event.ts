/**
 * Touch Portal will send messages to the plug-in at certain events.
 * Currently the only message that is broadcast is the page change event.
 * You can use this broadcast for example to resend states whenever a page is loaded.
 * This will allow the user to get the latest states just as a page is loaded.
 *
 * https://www.touch-portal.com/api/index.php?section=communication_listen_broadcast
 *
 * @property type - The "broadcast" corresponts to a message type that is send from Touch Portal to all plug-ins. This is information non specific to your plug-in..
 * @property event - The type of broadcast event that is triggered. Currently only the "pageChange" is supported.
 * @property pageName - (Optional) The name of the page navigated to. The value will be send only when the broadcast is of the type "pageChange".
 * @property previousPageName - (Optional) The name of the page navigated from. The value will be send only when the broadcast is of the type "pageChange".
 * @property deviceIp - (Optional) 	The device ip of the device navigating pages. The value will be send only when the broadcast is of the type "pageChange".
 * @property deviceName - (Optional) The device name of the device navigating pages. The value will be send only when the broadcast is of the type "pageChange".
 * @property deviceId - (Optional) The device id (set for multiple devices upgrade) of the device navigating pages. The value will be send only when the broadcast is of the type "pageChange".
 */
export type BroadcastEvent = {
  type: 'broadcast';
  event: string;
  pageName?: string;
  previousPageName?: string;
  deviceIp?: string;
  deviceName?: string;
  deviceId?: string;
};
