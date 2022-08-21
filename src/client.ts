import EventEmitter from 'events';
import net from 'net';
import http from 'https';
import compareVersions from 'compare-versions';
import { requireFromAppRoot } from 'require-from-app-root';

const pluginVersion: string = requireFromAppRoot('package.json').version;

const SOCKET_IP = '127.0.0.1';
const SOCKET_PORT = 12136;
const CONNECTOR_PREFIX = 'pc';

console.log('Version 3');

type ConnectOptions = {
  pluginId: string;
  updateUrl?: string | URL;
};

type State = {
  id: string;
  type: string;
  desc: string;
  defaultValue: string;
  parentGroup?: string;
};

type StateUpdate = {
  type: 'stateUpdate';
  id: string;
  value: string;
};

type PairingMessage = {
  type: string;
  id: string;
};

type ActionData = {
  minValue: number;
  maxValue: number;
  id: string;
  type: 'number';
};

class TouchPortalClient extends EventEmitter {
  pluginId: string | null;

  socket: net.Socket | null;

  customStates: Set<string>;

  updateUrl: string | URL | null;

  constructor() {
    super();
    this.pluginId = null;
    this.socket = null;
    this.customStates = new Set<string>();
  }

  createState(
    id: string,
    desc: string,
    defaultValue: string,
    parentGroup?: string,
  ): void {
    if (this.customStates.has(id)) {
      this.logIt('ERROR', `createState: Custom state of ${id} already created`);
      throw new Error(`createState: Custom state of ${id} already created`);
    }
    this.customStates.add(id);
    const newState: State = {
      type: 'createState',
      id: id.toString(),
      desc: desc.toString(),
      defaultValue: defaultValue.toString(),
    };
    if (parentGroup) {
      newState.parentGroup = parentGroup.toString();
    }
    this.send(newState);
  }

  createStateMany(states: State[]): void {
    const createStateArray: State[] = [];

    if (states.length <= 0) {
      this.logIt('ERROR', 'createStateMany : states contains no data');
      throw new Error('createStateMany: states contains no data');
    }

    states.forEach((state: State) => {
      if (this.customStates.has(state.id)) {
        this.logIt(
          'WARN',
          `createState: Custom state of ${state.id} already created`,
        );
      } else {
        this.customStates.add(state.id);
        const newState: State = {
          type: 'createState',
          id: state.id.toString(),
          desc: state.desc.toString(),
          defaultValue: state.defaultValue.toString(),
        };
        if (!state.parentGroup) {
          newState.parentGroup = state.parentGroup.toString();
        }
        createStateArray.push(newState);
      }
    });

    this.sendArray(createStateArray);
  }

  removeState(id: string): void {
    if (!this.customStates.has(id)) {
      this.logIt(
        'ERROR',
        `removeState: Custom state of ${id} never created, so cannot remove it`,
      );
      throw new Error(
        `removeState: Custom state of ${id} never created, so cannot remove it`,
      );
    }
    this.customStates.delete(id);
    this.send({
      type: 'removeState',
      id: id.toString(),
    });
  }

  choiceUpdate(id: string, value: string[]): void {
    if (value.length <= 0) {
      this.logIt('ERROR', 'choiceUpdate: value is an empty array');
      throw new Error('choiceUpdate: value is an empty array');
    }
    this.send({ type: 'choiceUpdate', id, value });
  }

  choiceUpdateSpecific(id: string, value: string[], instanceId: string): void {
    if (value.length <= 0) {
      this.logIt(
        'ERROR',
        'choiceUpdateSpecific : value does not contain data in an array format',
      );
      throw new Error(
        'choiceUpdateSpecific: value does not contain data in an array format',
      );
    }
    if (!instanceId) {
      this.logIt('ERROR', 'choiceUpdateSpecific : instanceId is not populated');
      throw new Error('choiceUpdateSpecific: instanceId is not populated');
    }
    this.send({
      type: 'choiceUpdate',
      id,
      instanceId,
      value,
    });
  }

  settingUpdate(name: string, value: string): void {
    this.send({
      type: 'settingUpdate',
      name,
      value,
    });
  }

  stateUpdate(id: string, value: string): void {
    const update: StateUpdate = {
      type: 'stateUpdate',
      id: id.toString(),
      value: value.toString(),
    };
    this.send(update);
  }

  stateUpdateMany(updates: StateUpdate[]): void {
    const stateUpdateArray: StateUpdate[] = [];

    if (updates.length <= 0) {
      this.logIt('ERROR', 'stateUpdateMany : states contains no data');
      throw new Error('stateUpdateMany: states contains no data');
    }

    updates.forEach((update: StateUpdate) => {
      stateUpdateArray.push({
        type: 'stateUpdate',
        id: update.id.toString(),
        value: update.value.toString(),
      });
    });

    this.sendArray(stateUpdateArray);
  }

  connectorUpdate(
    id: string,
    value: string,
    data: any,
    isShortId = false,
  ): void {
    this.send(this.buildConnectorUpdate(id, value, data, isShortId));
  }

  buildConnectorUpdate(
    id: string,
    value: string,
    data: any,
    isShortId: boolean,
  ): void {
    const newValue: number = parseInt(value, 10);
    if (newValue < 0 || newValue > 100) {
      this.logIt(
        'ERROR',
        `connectorUpdate: value has to be between 0 and 100 ${newValue}`,
      );
      throw new Error(
        `connectorUpdate: value has to be between 0 and 100 ${newValue}`,
      );
    }

    const connectorUpdateObj: any = {
      type: 'connectorUpdate',
      value: newValue,
    };
    if (isShortId) {
      connectorUpdateObj.shortId = id;
    } else {
      let dataStr = '';
      if (typeof data === 'object' && Array.isArray(data)) {
        data.forEach((dataItem) => {
          dataStr = dataStr.concat('|', dataItem.id, '=', dataItem.value);
        });
      }

      const connectorId = `${CONNECTOR_PREFIX}_${this.pluginId}_${id}${dataStr}`;
      connectorUpdateObj.connectorId = connectorId;
    }
    return connectorUpdateObj;
  }

  connectorUpdateMany(connectors: any[]): void {
    const connectorArray = [];

    if (connectors.length <= 0) {
      this.logIt('ERROR', 'connectorManyUpdate : connectors contains no data');
      throw new Error('connectorManyUpdate: connectors contains no data');
    }
    connectors.forEach((connector) => {
      const isShortId = connector.shortId !== undefined;
      connector.id = isShortId ? connector.shortId : connector.id;
      connectorArray.push(
        this.buildConnectorUpdate(
          connector.id,
          connector.value,
          connector.data,
          isShortId,
        ),
      );
    });
    this.sendArray(connectorArray);
  }

  updateActionData(actionInstanceId: string, data: ActionData): void {
    if (!data.id || !data.minValue || !data.maxValue || !data.type) {
      this.logIt(
        'ERROR',
        'updateActionData : required data is missing from instance',
        JSON.stringify(data),
      );
      throw new Error(
        `updateActionData: required data is missing from instance. ${JSON.stringify(
          data,
        )}`,
      );
    }
    if (data.type !== 'number') {
      this.logIt('ERROR', 'updateActionData : only number types are supported');
      throw new Error('updateActionData: only number types are supported');
    }
    this.send({
      type: 'updateActionData',
      instanceId: actionInstanceId,
      data,
    });
  }

  sendNotification(
    notificationId: string,
    title: string,
    msg: string,
    optionsArray: any,
  ): void {
    if (!optionsArray || optionsArray.length <= 0) {
      this.logIt('ERROR', 'sendNotification: at least one option is required');
      throw new Error('sendNotification: at least one option is required');
    }
    this.send({
      type: 'showNotification',
      notificationId,
      title,
      msg,
      options: optionsArray,
    });
  }

  sendArray(dataArray: any[]): void {
    let dataStr = '';
    if (dataArray.length <= 0) {
      this.logIt('ERROR', 'sendArray : dataArray has no length');
      throw new Error('sendArray: dataArray has no length');
    }
    dataArray.forEach((element) => {
      dataStr = `${dataStr + JSON.stringify(element)}\n`;
    });

    if (dataStr == null) {
      return;
    }

    this.socket.write(dataStr);
  }

  send(data: any): void {
    this.socket.write(`${JSON.stringify(data)}\n`);
  }

  pair(): void {
    const pairMsg: PairingMessage = {
      type: 'pair',
      id: this.pluginId,
    };
    this.send(pairMsg);
  }

  checkForUpdate(): void {
    const parent = this;
    http
      .get(this.updateUrl, (res) => {
        const { statusCode } = res;

        // Any 2xx status code signals a successful response but
        // here we're only checking for 200.
        if (statusCode !== 200) {
          const error: Error = new Error(
            `${this.pluginId}:ERROR: Request Failed.\nStatus Code: ${statusCode}`,
          );
          parent.logIt('ERROR', `check for update errored: ${error.message}`);
          res.resume();
          return;
        }

        res.setEncoding('utf8');
        let updateData = '';
        res.on('data', (chunk) => {
          updateData += chunk;
        });
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(updateData);
            if (jsonData.version !== null) {
              if (compareVersions(jsonData.version, pluginVersion) > 0) {
                parent.emit('Update', pluginVersion, jsonData.version);
              }
            }
          } catch (e) {
            parent.logIt('ERROR: Check for Update error=', e.message);
          }
        });
        res.on('error', (error) => {
          parent.logIt(
            'ERROR',
            'error received attempting to check for update:',
            error,
          );
        });
      })
      .on('error', (error) => {
        parent.logIt(
          'ERROR',
          'error received attempting to check for update:',
          error,
        );
      });
  }

  connect(options: ConnectOptions): void {
    const { pluginId, updateUrl } = options;
    this.pluginId = pluginId;
    const parent = this;

    if (updateUrl) {
      this.updateUrl = updateUrl;
      this.checkForUpdate();
    }

    this.socket = new net.Socket();
    this.socket.setEncoding('utf-8');
    this.socket.connect(SOCKET_PORT, SOCKET_IP, () => {
      parent.logIt('INFO', 'Connected to TouchPortal');
      parent.emit('connected');
      parent.pair();
    });

    this.socket.on('data', (data) => {
      const lines = data.toString().split(/(?:\r\n|\r|\n)/);

      lines.forEach((line) => {
        if (line === '') {
          return;
        }
        const message = JSON.parse(line);

        // Handle internal TP Messages here, else pass to user code
        switch (message.type) {
          case 'closePlugin':
            if (message.pluginId === parent.pluginId) {
              parent.emit('Close', message);
              parent.logIt('WARN', 'received Close Plugin message');
              parent.socket.end();
              process.exit(0);
            }
            break;
          case 'info':
            parent.logIt('DEBUG', 'Info Message received');
            parent.emit('Info', message);
            if (message.settings) {
              parent.emit('Settings', message.settings);
            }
            break;
          case 'notificationOptionClicked':
            parent.logIt('DEBUG', 'Notification Option Clicked');
            parent.emit('NotificationClicked', message);
            break;
          case 'settings':
            parent.logIt('DEBUG', 'Settings Message received');
            // values is the key that is the same as how info contains settings key, for direct settings saving
            parent.emit('Settings', message.values);
            break;
          case 'listChange':
            parent.logIt('DEBUG', 'ListChange Message received');
            parent.emit('ListChange', message);
            break;
          case 'action':
            parent.logIt('DEBUG', 'Action Message received');
            parent.emit('Action', message, null);
            break;
          case 'broadcast':
            parent.logIt('DEBUG', 'Broadcast Message received');
            parent.emit('Broadcast', message);
            break;
          case 'shortConnectorIdNotification':
            parent.logIt('DEBUG', 'ShortID Connector Notification received');
            parent.emit('ConnectorShortIdNotification', message);
            break;
          case 'connectorChange':
            parent.logIt('DEBUG', 'Connector Change received');
            parent.emit('ConnectorChange', message);
            break;
          case 'up':
            parent.logIt('DEBUG', 'Up Hold Message received');
            parent.emit('Action', message, false);
            break;
          case 'down':
            parent.logIt('DEBUG', 'Down Hold Message received');
            parent.emit('Action', message, true);
            break;
          default:
            parent.logIt('DEBUG', `Unhandled type received ${message.type}`);
            parent.emit('Message', message);
        }
      });
    });
    this.socket.on('error', () => {
      parent.logIt('ERROR', 'Socket Connection closed');
      process.exit(0);
    });

    this.socket.on('close', () => {
      parent.logIt('WARN', 'Connection closed');
    });
  }

  logIt(...args: any): void {
    const curTime = new Date().toISOString();
    const message = args;
    const type = message.shift();
    console.log(curTime, ':', this.pluginId, `:${type}:`, message.join(' '));
  }
}

export default TouchPortalClient;
