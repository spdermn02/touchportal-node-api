import type { TouchPortalOutgoingRequestType } from '../touch-portal-outgoing-request-type';

/**
 * You can also update choice lists in Touch Portal. This will update the choice lists with the given ID.
 *
 * Sending a piece of data (a message) to Touch Portal should always end with a newline character.
 * This will indicate Touch Portal that it is the whole message.
 *
 * https://www.touch-portal.com/api/index.php?section=choiceUpdate
 *
 * @property type - The type of the request, always set to 'choiceUpdate'.
 * @property id - The state id to set/update.
 * @property value - The collection of texts that should be the new list to display for this given choice list id.
 */
export type UpdateChoiceListRequest = {
  type: TouchPortalOutgoingRequestType.UpdateChoiceList;
  id: string;
  value: string[];
};
