/**
 * You can remove states at runtime.
 *
 * https://www.touch-portal.com/api/index.php?section=communication_remove_state
 *
 * @property type - The type of the request, always set to 'removeState'.
 * @property id - The id of the plug-in state to remove.
 */
export type RemoveStateRequest = {
  type: 'removeState';
  id: string;
};
