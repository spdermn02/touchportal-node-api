/**
 * Whenever a user creates a connector for the first time a shortId is generated for that connector that represents the long connectorId.
 * This short id is useful for when you create long connector ids and the id will be longer than the max of 200 characters.
 *
 * You can use this shortId instead of the long connectorId to update the connector value in Touch Portal.
 *
 * This message can be send by Touch Portal on several occassions and can be sent multiple times per connectorId and shortId combination.
 *
 * https://www.touch-portal.com/api/index.php?section=communication_listen_connector_short_id_info
 *
 * @property type - The event type, always set to 'shortConnectorIdNotification'.
 * @property pluginId - The id of the plugin.
 * @property shortId - The shortid of the connector.
 * @property connectorId - The long normal connector id.
 */
export type ConnectorShortIdInfoEvent = {
  type: 'shortConnectorIdNotification';
  pluginId: string;
  shortId: number;
  connectorId: string;
};
