import type { DeviceInfo } from './device-info';
import type { TouchPortalIncomingEventType } from './touch-portal-incoming-event-type';

/**
 * Represents an informational event received from Touch Portal.
 *
 * @property type The type of the event, always set to 'info'.
 * @property sdkVersion The version of the SDK in use.
 * @property tpVersionString The Touch Portal version as a string.
 * @property tpVersionCode The Touch Portal version as a numeric code.
 * @property pluginVersion The version of the plugin.
 * @property settings An array of settings objects, each represented as a record of string key-value pairs.
 * @property currentPagePathMainDevice The current page path for the main device.
 * @property currentPagePathSecondaryDevices An array of device information for secondary devices.
 * @property status The current status of the plugin.
 */
export type InfoEvent = {
  type: TouchPortalIncomingEventType.Info;
  sdkVersion: string;
  tpVersionString: string;
  tpVersionCode: number;
  pluginVersion: number;
  settings: Record<string, string>[];
  currentPagePathMainDevice: string;
  currentPagePathSecondaryDevices: DeviceInfo[];
  status: string;
};
