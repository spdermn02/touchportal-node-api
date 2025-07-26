import type { TouchPortalOutgoingRequestType } from '../touch-portal-outgoing-request-type';

/**
 * You can trigger predefined Events by sending a message to Touch Portal with the given eventId and additional data.
 *
 * Sending a piece of data (a message) to Touch Portal should always end with a newline character.
 * This will indicate Touch Portal that it is the whole message.
 *
 * https://www.touch-portal.com/api/index.php?section=communication_trigger_event
 *
 * @property type - The type of the request, always set to 'triggerEvent'.
 * @property eventId - The event id to trigger.
 * @property states - This is a JSON Object that holds key value pairs of data that are used within Touch Portal as Local States.
 */
export type TriggerEventRequest = {
  type: TouchPortalOutgoingRequestType.TriggerEvent;
  eventId: string;
  states?: Record<string, string>;
};
