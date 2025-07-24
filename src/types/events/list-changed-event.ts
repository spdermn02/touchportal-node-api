import type { EventData } from './event-data';
import type { TouchPortalIncomingEventType } from './touch-portal-incoming-event-type';

/**
 * Touch Portal will send messages when a list of choices value is changed.
 * Your software needs to handle these messages and act on it if you want to use this functionality.
 * This is especially useful when your action (or event/connector) has multiple drop down list boxes where selecting an item in the first needs to repopulate the second.
 *
 * https://www.touch-portal.com/api/index.php?section=communication_listen_list_changed
 *
 * @property type - The event type, always set to 'listChange'.
 * @property pluginId - The id of the plugin.
 * @property actionId - The id of the action.
 * @property listId - The id of the list being used in the inline action.
 * @property instanceId - The id of the instance.
 * @property value - The value that was added.
 * @property values - An array of event data representing the new state of the list.
 */
export type ListChangedEvent = {
  type: TouchPortalIncomingEventType.ListChanged;
  pluginId: string;
  actionId: string;
  listId: string;
  instanceId: string;
  value: string;
  values: EventData[];
};
