import { EventData } from './event-data';

/**
 * Touch Portal will send messages to your plugin when the action is used in a hold button event.
 * When the user presses the Touch Portal button down, Touch Portal will send the "down" event.
 * When the user releases the button, Touch Portal will send the "up" event.
 * Only actions that have hold settings can be used in Touch Portal in the Hold tab.
 *
 * https://www.touch-portal.com/api/index.php?section=communication_listen_action_hold_info
 *
 * @property type - Indicates whether the action is pressed down ('down') or released ('up').
 * @property pluginId - The id of the plugin.
 * @property actionId - The id of the action.
 * @property data - An array of id's and value's containing additional data for the event.
 */
export type ActionHoldInfoEvent = {
  type: 'up' | 'down';
  pluginId: string;
  actionId: string;
  data: EventData[];
};
