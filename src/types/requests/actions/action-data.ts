/**
 * Represents the data structure for an action.
 *
 * @property minValue - The new minimal value for the action data.
 * @property maxValue - he new maximum value for the action data.
 * @property id - The id of the action data to be altered.
 * @property type - We only support this for the type "number" at this moment.
 */
export type ActionData = {
  minValue: number;
  maxValue: number;
  id: string;
  type: string;
};
