/**
 * You can also update state lists in Touch Portal. These state lists needs to be defined in the entry file.
 *
 * Sending a piece of data (a message) to Touch Portal should always end with a newline character.
 * This will indicate Touch Portal that it is the whole message.
 *
 * https://www.touch-portal.com/api/index.php?section=communication_create_update_state_lists
 *
 * @property type - The type of the request, always set to 'stateListUpdate'.
 * @property id - The state id to set/update.
 * @property value - The collection of texts that should be the new list to display for this given choice list id.
 */
export type UpdateStateListRequest = {
  type: 'stateListUpdate';
  id: string;
  value: string[];
};
