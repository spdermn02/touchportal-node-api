import EventEmitter from 'events';
import net from 'net';
import {
  LoggingLevel,
  TouchPortalClientOptions,
  TouchPortalConnectOptions,
  CreateNotificationRequest,
  CreateStateRequest,
  NotificationOption,
  RemoveStateRequest,
  UpdateChoiceListRequest,
  UpdateSettingRequest,
  UpdateSpecificChoiceListRequest,
  UpdateStateRequest,
  ActionData,
  UpdateActionDataRequest,
  UpdateConnectorDataRequest,
  PairRequest,
  ConnectorData
} from './types';

const SOCKET_IP = '127.0.0.1';
const SOCKET_PORT = 12136;
const CONNECTOR_PREFIX = 'pc';

export default class TouchPortalClient extends EventEmitter {
  private pluginId?: string;
  private socket: net.Socket | null;
  private customStates: Record<string, string>;
  private logCallback?: ((level: LoggingLevel, ...args: unknown[]) => void) | null;

  /**
   * Creates an instance of TouchPortalClient.
   *
   * @param options - Optional configuration options for the client.
   */
  constructor(options: TouchPortalClientOptions = {}) {
    super(options);

    this.pluginId = options?.pluginId;
    this.socket = null;
    this.customStates = {};
    this.logCallback = options?.logCallback;
  }

  // Connection
  public connect(options: TouchPortalConnectOptions = {}): void {
    const { pluginId, exitOnClose = true } = options ?? {};

    if (pluginId) {
      this.pluginId = pluginId;
    }

    if (!this.pluginId) {
      this.log(LoggingLevel.ERROR, 'connect: pluginId is missing or empty.');
      throw new Error('connect: pluginId is missing or empty.');
    }

    this.socket = new net.Socket();
    this.socket.setEncoding('utf8');
    this.socket.connect(SOCKET_PORT, SOCKET_IP, () => {
      this.emit('connected');
      this.pair();
    });

    // Set up a buffer to potentially store partial incoming messages.
    let lineBuffer = '';
    this.socket.on('data', (data: string) => {
      // Track current newline search position in data string, starting from the beginning.
      let pos = 0;
      while (pos < data.length) {
        // Find the next newline character starting from our last search position in the data string.
        const n = data.indexOf('\n', pos);
        // If no newline was found then this is a partial message -- buffer it for later and wait for more data.
        if (n < 0) {
          lineBuffer += data.substring(pos);
          break;
        }

        // Prepend any buffered data to current line. Buffer may be empty, but is it worth checking for that?
        const line = lineBuffer + data.substring(pos, n);
        pos = n + 1; // advance next newline search position
        lineBuffer = ''; // we're done with the line buffer

        // Try to decode the message.
        let message;
        try {
          message = JSON.parse(line);
        } catch (ex) {
          this.log(LoggingLevel.ERROR, 'JSON exception while parsing line:', line, '\n', ex);
          continue;
        }

        // Handle internal TP Messages here, else pass to user code
        switch (message.type) {
          case 'closePlugin':
            if (message.pluginId === this.pluginId) {
              this.emit('Close', message);
              this.disconnect();
            }
            break;
          case 'info':
            this.emit('Info', message);

            if (message.settings) {
              this.emit('Settings', message.settings);
            }

            break;
          case 'notificationOptionClicked':
            this.emit('NotificationClicked', message);
            break;
          case 'settings':
            // values is the key that is the same as how info contains settings key, for direct settings saving
            this.emit('Settings', message.values);
            break;
          case 'listChange':
            this.emit('ListChange', message);
            break;
          case 'action':
            this.emit('Action', message, null);
            break;
          case 'broadcast':
            this.emit('Broadcast', message);
            break;
          case 'shortConnectorIdNotification':
            this.emit('ConnectorShortIdNotification', message);
            break;
          case 'connectorChange':
            this.emit('ConnectorChange', message);
            break;
          case 'up':
            this.emit('Action', message, false);
            break;
          case 'down':
            this.emit('Action', message, true);
            break;
          default:
            this.emit('Message', message);
        }
      }
    });

    this.socket.on('error', (err) => {
      this.emit('socketError', err);
      this.log(LoggingLevel.ERROR, 'Socket Error', err.message);
    });

    this.socket.on('close', (hadError) => {
      this.emit('disconnected', hadError);
      this.log(LoggingLevel.WARNING, 'Connection closed');

      if (exitOnClose) {
        process.exit(0);
      }
    });
  }

  public disconnect(): void {
    if (this.socket && !this.socket.destroyed) {
      this.socket.end();
    }
  }

  // Actions
  public updateActionData(data: ActionData, instanceId?: string): void {
    if ([data.id, data.minValue, data.maxValue, data.type].some((value) => value === undefined || value === '')) {
      this.log(LoggingLevel.ERROR, 'updateActionData: required data is missing from instance', JSON.stringify(data));
      throw new Error(`updateActionData: required data is missing from instance. ${JSON.stringify(data)}`);
    }

    if (data.type !== 'number') {
      this.log(LoggingLevel.ERROR, 'updateActionData: only number types are supported');
      throw new Error('updateActionData: only number types are supported');
    }

    const request: UpdateActionDataRequest = { type: 'updateActionData', instanceId, data };
    this.send(request);
  }

  // Choices
  public updateChoice(id: string, value: string[]): void {
    if (!id) {
      this.log(LoggingLevel.ERROR, 'updateChoice: id parameter is empty');
      throw new Error('updateChoice: id parameter is empty');
    }

    if (!this.isValidArray(value, false)) {
      this.log(LoggingLevel.ERROR, 'updateChoice: value parameter must be an array');
      throw new Error('updateChoice: value parameter must be an array');
    }

    const request: UpdateChoiceListRequest = { type: 'choiceUpdate', id, value };
    this.send(request);
  }

  public updateSpecificChoice(id: string, instanceId: string, value: string[]): void {
    if (!id) {
      this.log(LoggingLevel.ERROR, 'updateSpecificChoice: id parameter is empty');
      throw new Error('updateSpecificChoice: id parameter is empty');
    }

    if (!instanceId) {
      this.log(LoggingLevel.ERROR, 'updateSpecificChoice: instanceId is not populated');
      throw new Error('updateSpecificChoice: instanceId is not populated');
    }

    if (!this.isValidArray(value, false)) {
      this.log(LoggingLevel.ERROR, 'updateSpecificChoice: value parameter must be an array');
      throw new Error('updateSpecificChoice: value parameter must be an array');
    }

    const request: UpdateSpecificChoiceListRequest = {
      type: 'choiceUpdate',
      id,
      instanceId,
      value
    };

    this.send(request);
  }

  // Connectors
  public updateConnector(value: number, connectorId?: string, shortId?: string, data?: ConnectorData[]): void {
    const request = this.buildUpdateConnectorDataRequest(value, connectorId, shortId, data);
    this.send(request);
  }

  public updateMultipleConnectors(
    connectors: {
      value: number;
      connectorId?: string;
      shortId?: string;
      data?: ConnectorData[];
    }[]
  ): void {
    if (!this.isValidArray(connectors, true)) {
      this.log(LoggingLevel.ERROR, 'updateMultipleConnectors: connectors contains no data');
      throw new Error('updateMultipleConnectors: connectors contains no data');
    }

    const request: UpdateConnectorDataRequest[] = connectors.map((connector) =>
      this.buildUpdateConnectorDataRequest(connector.value, connector.connectorId, connector.shortId, connector.data)
    );

    this.sendArray(request);
  }

  private buildUpdateConnectorDataRequest(
    value: number,
    connectorId?: string,
    shortId?: string,
    data?: ConnectorData[]
  ): UpdateConnectorDataRequest {
    if (value < 0 || value > 100) {
      this.log(LoggingLevel.ERROR, `connectorUpdate: value has to be between 0 and 100 ${value}`);
      throw new Error(`connectorUpdate: value has to be between 0 and 100 ${value}`);
    }

    if (!connectorId && !shortId) {
      this.log(LoggingLevel.ERROR, 'connectorUpdate: both connectorId and shortId are not provided');
      throw new Error('connectorUpdate: both connectorId and shortId are not provided');
    }

    if (connectorId && shortId) {
      this.log(LoggingLevel.ERROR, 'connectorUpdate: both connectorId and shortId are provided');
      throw new Error('connectorUpdate: both connectorId and shortId are provided');
    }

    if (connectorId && !this.isValidArray(data, false)) {
      this.log(LoggingLevel.ERROR, 'connectorUpdate: when connectorId is provided, data must be an array');
      throw new Error('connectorUpdate: when connectorId is provided, data must be an array');
    }

    if (shortId && this.isValidArray(data, false)) {
      this.log(LoggingLevel.ERROR, 'connectorUpdate: when shortId is provided, data is not allowed');
      throw new Error('connectorUpdate: when shortId is provided, data is not allowed');
    }

    if (connectorId) {
      const dataStr = data!.map((item) => `${item.id}=${item.value}`).join('|');

      return {
        type: 'connectorUpdate',
        connectorId: `${CONNECTOR_PREFIX}_${this.pluginId}_${connectorId}${dataStr}`,
        value
      };
    }

    return { type: 'connectorUpdate', shortId, value };
  }

  // Notifications
  public showNotification(notificationId: string, title: string, msg: string, options: NotificationOption[]): void {
    if (!this.isValidArray(options, true)) {
      this.log(LoggingLevel.ERROR, 'showNotification: at least one option is required');
      throw new Error('showNotification: at least one option is required');
    }

    const request: CreateNotificationRequest = {
      type: 'showNotification',
      notificationId,
      title,
      msg,
      options
    };

    this.send(request);
  }

  // Settings
  public updateSetting(name: string, value: string) {
    const request: UpdateSettingRequest = { type: 'settingUpdate', name, value };
    this.send(request);
  }

  // States
  public createState(
    id: string,
    desc: string,
    defaultValue: string | number | boolean,
    parentGroup?: string,
    forceUpdate?: boolean
  ): void {
    if (this.customStates[id]) {
      this.log(LoggingLevel.ERROR, `createState: Custom state of ${id} already created`);
      throw new Error(`createState: Custom state of ${id} already created`);
    }

    this.customStates[id] = desc;

    const request: CreateStateRequest = {
      type: 'createState',
      id,
      desc,
      defaultValue: `${defaultValue}`,
      parentGroup,
      forceUpdate
    };

    this.send(request);
  }

  public createMultipleStates(
    states: {
      id: string;
      desc: string;
      defaultValue: string | number | boolean;
      parentGroup?: string;
      forceUpdate?: boolean;
    }[]
  ): void {
    if (!this.isValidArray(states, true)) {
      this.log(LoggingLevel.ERROR, 'createMultipleStates: states contains no data');
      throw new Error('createMultipleStates: states contains no data');
    }

    const request: CreateStateRequest[] = states
      .filter((state) => {
        if (this.customStates[state.id]) {
          this.log(LoggingLevel.WARNING, `createMultipleStates: Custom state of ${state.id} already created`);
          return false;
        }

        return true;
      })
      .map((state) => {
        this.customStates[state.id] = state.desc;

        return {
          type: 'createState',
          id: state.id,
          desc: state.desc,
          defaultValue: String(state.defaultValue),
          parentGroup: state.parentGroup,
          forceUpdate: state.forceUpdate
        };
      });

    this.sendArray(request);
  }

  public updateState(id: string, value: string | number | boolean): void {
    const request: UpdateStateRequest = { type: 'stateUpdate', id, value: `${value}` };
    this.send(request);
  }

  public updateMultipleStates(states: { id: string; value: string | number | boolean }[]): void {
    if (!this.isValidArray(states, true)) {
      this.log(LoggingLevel.ERROR, 'updateMultpleStates: states contains no data');
      throw new Error('updateMultpleStates: states contains no data');
    }

    const request: UpdateStateRequest[] = states.map((state) => ({
      type: 'stateUpdate',
      id: state.id,
      value: String(state.value)
    }));

    this.sendArray(request);
  }

  public removeState(id: string): void {
    if (!id) {
      this.log(LoggingLevel.ERROR, 'removeState: id parameter is empty');
      throw new Error('removeState: id parameter is empty');
    }

    delete this.customStates[id];

    const request: RemoveStateRequest = { type: 'removeState', id };
    this.send(request);
  }

  public send(data: unknown): void {
    this.socket?.write(JSON.stringify(data));
    this.socket?.write('\n');
  }

  public sendArray(dataArray: unknown[]): void {
    if (!this.isValidArray(dataArray, true)) {
      this.log(LoggingLevel.ERROR, 'sendArray: dataArray has no length');
      throw new Error('sendArray: dataArray has no length');
    }

    const dataStr = dataArray.map((data: unknown) => JSON.stringify(data)).join('\n');

    if (!dataStr) {
      return;
    }

    this.socket?.write(dataStr);
  }

  // Internal
  private pair(): void {
    if (!this.pluginId) {
      this.log(LoggingLevel.ERROR, 'pair: pluginId is missing or empty.');
      throw new Error('pair: pluginId is missing or empty.');
    }

    const request: PairRequest = { type: 'pair', id: this.pluginId };
    this.send(request);
  }

  private isValidArray(data: unknown[] | undefined, mustHaveData: boolean): boolean {
    return mustHaveData ? Array.isArray(data) && data.length > 0 : Array.isArray(data);
  }

  private log(level: LoggingLevel, ...args: unknown[]): void {
    if (typeof this.logCallback === 'function') {
      this.logCallback(level, ...args);
    } else if (this.logCallback === undefined) {
      console.log(`${new Date().toISOString()} : ${this.pluginId || ''} :${level}:`, ...args);
    }
  }
}
