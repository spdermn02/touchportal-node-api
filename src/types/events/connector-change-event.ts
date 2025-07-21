import { EventData } from './event-data';

/**
 * Touch Portal will send messages to your plugin when the connector is used in a connector event.
 * Currently this is when a user has connected the connector to a slider and uses the slider control to change the value.
 * This will trigger the "connectorChange" type of message. The value is an integer number ranging from 0 to 100.
 *
 * Touch Portal will send the connector data and value in the following way:
 * - On Finger Down, is always send
 * - On Finger Move, send each 100ms interval if value changed.
 * - On Finger Up, is always send
 *
 * Touch Portal will send a value when the user presses his finger on the associated slider.
 * While the finger is still pressing on the slider control it will send every 100ms the value.
 * If the value is not updated because the finger does not move it will not resend the same value.
 * The 100ms is also an indication and can be slower on different set ups and network quality. The minimum however is 100ms.
 *
 * The slider will always send at least two messages. When the user presses the slider like a button, the same value will be send twice due to the UP and DOWN event.
 *
 * https://www.touch-portal.com/api/index.php?section=communication_listen_connector_change
 *
 * @property type - The event type, always set to 'connectorChange'.
 * @property pluginId - The id of the plugin.
 * @property connectorId - The id of the action.
 * @property value - Number between 0-100, sliders only.
 * @property valueDecimal - Double number, dials only.
 * @property data - An array of id's and value's containing additional data for the event.
 */
export type ConnectorChangeEvent = {
  type: 'connectorChange';
  pluginId: string;
  connectorId: string;
  value: number;
  valueDecimal: number;
  data: EventData[];
};
