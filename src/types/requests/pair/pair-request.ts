import type { TouchPortalOutgoingRequestType } from '../touch-portal-outgoing-request-type';

/**
 * @property type - The type of the request, always set to 'pair'.
 * @property id - The id of the plugin.
 */
export type PairRequest = {
  type: TouchPortalOutgoingRequestType.Pair;
  id: string;
};
