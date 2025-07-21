/**
 * Connectors within Touch Portal can be bi-directional.
 * This means that your plug-in will receive updates when the user uses a connector supported control that has your connector connected
 * but it also means that your plug-in is able to update the connector value within Touch Portal which will update the controls position as well.
 *
 * You can update connectors as a whole. This means that every control that has the connector will show the change,
 * you cannot single out a specific control. This is because the nature of connectors is that they always represent the current state if used bi-directional.
 *
 * When sending the value to Touch Portal, please be advised that Touch Portal will throttle the communication by sending an update of the value
 * to the mobile device each 100ms. This 100ms is an indication and can be slower on different set ups and network quality. The minimum however is 100ms.
 *
 * While the minimum supported update speed is 100ms we strongly suggest to only send that when necessary.
 * Touch Portal actively checks for when a plug-in sends too much redundant connector states. Only send this data when the value actually changes.
 *
 * https://www.touch-portal.com/api/index.php?section=communication_create_update_connector_data
 *
 * @property type - The type of the request, always set to 'connectorUpdate'.
 * @property connectorId - (Optional) The id of the connector. This has the following syntax for connectors: pc_pluginId_connectorId
 * Then for each data object it will include a pipe plus the combination of the id and the value of the data object
 *
 * Example: |dataId=uservalue
 *
 * This will result in a long id for this particular connector, for example:
 * pc_testpluginid_connectorid1|setting1=testvalue|setting2=anothervalue
 *
 * Touch Portal will not allow id's longer than 200 characters so keep this as small as possible.
 *
 * NOTE: pc_pluginId are automatically added by the client and should not be included in the connectorId.
 * @property shortId - This is a small by Touch Portal generated representation of the connectorId.
 * Please understand that this is just a mapping from the short id to the full connectorId and has not dynamic function.
 * @property value - A value from 0-100. All other values will be ignored. This field is used for Slider values.
 * @property valueDecimal - (Optional) A decimal value. This field is used for Dial controls.
 * Depending on the set up of the user, updating this might not have an actual effect or the value can be capped functionally and/or visually.
 * Please note, if this attribute is set, the message is being interpreted as this type of message and the "value" attribute is ignored.
 */
export type UpdateConnectorDataRequest = {
  type: 'connectorUpdate';
  connectorId?: string;
  shortId?: string;
  value: number;
  valueDecimal?: number;
};
