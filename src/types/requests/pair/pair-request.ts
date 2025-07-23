/**
 * @property type - The type of the request, always set to 'pair'.
 * @property id - The id of the plugin.
 */
export type PairRequest = {
  type: 'pair';
  id: string;
};
