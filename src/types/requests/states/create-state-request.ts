/**
 * States can be created on runtime using by sending a "createState" message to Touch Portal with the given information.
 *
 * https://www.touch-portal.com/api/index.php?section=communication_create_state
 *
 * @property type - The type of the request, always set to 'createState'.
 * @property id - The id of the newly created plug-in state. Please ensure unique names, otherwise you may corrupt other plug-ins.
 * @property desc - The displayed name within Touch Portal which represents the state..
 * @property defaultValue - The default value the state will have on creation.
 * @property parentGroup - (Optional) The name of the parent group of this state.
 * The parent group of this state will be used to group the state in the menus used throughout Touch Portal.
 * Every state belonging to the same parent group name will be in the same selection menu.
 * @property forceUpdate - (Optional) This will force the update of the state if it is already created or
 * existing and will trigger the state changed event even if the value is the same as the already existing one.
 */
export type CreateStateRequest = {
  type: 'createState';
  id: string;
  desc: string;
  defaultValue: string;
  parentGroup?: string;
  forceUpdate?: boolean;
};
