import type { TouchPortalOutgoingRequestType } from '../touch-portal-outgoing-request-type';

/**
 * You can send state updates to Touch Portal.
 * More information about states and how to set them up in the description file can be found in the states section.
 * You can only change the states from your own plug-in. Changing states of Touch Portal itself may result in undesired behaviour.
 *
 * Sending a piece of data (a message) to Touch Portal should always end with a newline character.
 * This will indicate Touch Portal that it is the whole message.
 *
 * https://www.touch-portal.com/api/index.php?section=communication_create_update_state
 *
 * @property type - The type of the request, always set to 'stateUpdate'.
 * @property id - The state id to set/update.
 * @property value - The value of the state. Ensure this is a text and nothing else. Touch Portal will handle this value as a piece of text (string).
 */
export type UpdateStateRequest = {
  type: TouchPortalOutgoingRequestType.UpdateState;
  id: string;
  value: string;
};
