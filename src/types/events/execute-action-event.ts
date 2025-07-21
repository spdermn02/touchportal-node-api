import { EventData } from './event-data';

/**
 * Touch Portal will send messages when an action is being triggered (when the button containing one of your plug-in actions
 * is pressed or when an event is triggered that contains your action.)
 *
 * https://www.touch-portal.com/api/index.php?section=communication_listen_execute_action
 *
 * @property type - The event type, always set to 'action'.
 * @property pluginId - The id of the plugin.
 * @property actionId - The id of the action.
 * @property data - An array of id's and value's containing additional data for the event.
 */
export type ExecuteActionEvent = {
  type: 'action';
  pluginId: string;
  actionId: string;
  data: EventData[];
};
