/**
 * Represents a device associated with an event.
 *
 * @property tpDeviceId - The id of the device.
 * @property currentPagePath - The page the device is currently on.
 * @property deviceName - The name of the device.
 */
export type DeviceInfo = {
  tpDeviceId: string;
  currentPagePath: string;
  deviceName: string;
};
