import type { TouchPortalOutgoingRequestType } from '../touch-portal-outgoing-request-type';

/**
 * You can update specific lists in Touch Portal. This is different from state lists as these will update the dropdown list associated.
 * Still this is very handy when you want to fill in a list for the user based on changes in your plug-in.
 *
 * Sending a piece of data (a message) to Touch Portal should always end with a newline character. This will indicate Touch Portal that it is the whole message.
 *
 * Please note, This functionality only works for inline actions. Actions with a popup window do not support this functionality.
 *
 * https://www.touch-portal.com/api/index.php?section=communication_create_update_specific_list
 *
 * @property type - The type of the request, always set to 'choiceUpdate'.
 * @property id - The state id to set/update.
 * @property instanceId - This is the id of the instance that should be updated by this call.
 * @property value - The collection of texts that should be the new list to display for this given choice list id.
 */
export type UpdateSpecificChoiceListRequest = {
  type: TouchPortalOutgoingRequestType.UpdateSpecificList;
  id: string;
  instanceId: string;
  value: string[];
};
