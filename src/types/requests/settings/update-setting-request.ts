import type { TouchPortalOutgoingRequestType } from '../touch-portal-outgoing-request-type';

/**
 * With this option you can update a setting from your plug-in. This will overwrite the user setting.
 *
 * https://www.touch-portal.com/api/index.php?section=communication_create_update_setting
 *
 * @property type - The type of the request, always set to 'settingUpdate'.
 * @property name - The name of the settings, should be case sensitive correct.
 * @property value - The new value the setting should hold.
 */
export type UpdateSettingRequest = {
  type: TouchPortalOutgoingRequestType.UpdateSetting;
  name: string;
  value: string;
};
