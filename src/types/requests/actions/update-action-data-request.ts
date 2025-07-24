import type { ActionData } from './action-data';
import type { TouchPortalOutgoingRequestType } from '../touch-portal-outgoing-request-type';

/**
 * You can change the characteristich of certain action data using this message.
 *
 * At this moment you can only change the minValue and the maxValue attributes of action data.
 *
 * Sending a piece of data (a message) to Touch Portal should always end with a newline character.
 * This will indicate Touch Portal that it is the whole message.
 *
 * https://www.touch-portal.com/api/index.php?section=communication_create_update_action_data
 *
 * @property type - The type of the request, always set to 'updateActionData'.
 * @property instanceId - (Optional) This is the id of the instance that should be updated by this call.
 * @property data - The object containing all new data for the action data object.
 */
export type UpdateActionDataRequest = {
  type: TouchPortalOutgoingRequestType.UpdateSpecificAction;
  instanceId?: string;
  data: ActionData;
};
