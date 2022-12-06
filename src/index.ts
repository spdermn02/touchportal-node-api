import {EventEmitter} from 'events'
import * as net from 'net'
import { requireFromAppRoot } from 'require-from-app-root';
import * as compareVersions from 'compare-versions';
import * as http from 'https'
import {state, stateUpdate, connectorUpdate, connectOptions, createState, dataItem, connector, action, notificationOption } from './modules/types'

const pluginVersion = requireFromAppRoot('package.json').version;

const SOCKET_IP = '127.0.0.1';
const SOCKET_PORT = 12136;
const CONNECTOR_PREFIX = 'pc';

export class TouchPortalClient extends EventEmitter {
  pluginId:string
  socket:net.Socket
  customStates:object
  updateUrl:string

  constructor() {
    super();
    this.pluginId = "";
    this.socket = new net.Socket();
    this.customStates = {};
  }

  createState(id:string, desc:string, defaultValue:string, parentGroup?:string) {
    if (this.customStates[id]) {
      this.logIt('ERROR', `createState: Custom state of ${id} already created`);
      throw new Error(`createState: Custom state of ${id} already created`);
    }
    this.customStates[id] = desc;
    const newState = {
      type: 'createState',
      id: id,
      desc: desc,
      defaultValue: defaultValue,
      parentGroup: (parentGroup !== '' || parentGroup !== undefined) ? parentGroup : undefined
    };
 
    this.send(newState);
  }

  createStateMany(states:state[]) {
    let createStateArray:createState[] = [];

    if (states.length <= 0) {
      this.logIt('ERROR', 'createStateMany : states contains no data');
      throw new Error('createStateMany: states contains no data');
    }

    states.forEach((state) => {
      if (this.customStates[state.id]) {
        this.logIt('WARN', `createState: Custom state of ${state.id} already created`);
      } else {
        this.customStates[state.id] = state.desc;
        const newState = {
          type: 'createState',
          id: state.id,
          desc: state.desc,
          defaultValue: state.defaultValue,
          parentGroup: (state.parentGroup !== '' || state.parentGroup !== undefined) ? state.parentGroup : undefined
        };
        
        createStateArray.push(newState);
      }
    });

    this.sendArray(createStateArray);
  }

  removeState(id:string) {
    if (this.customStates[id] === undefined) {
      this.logIt('ERROR', `removeState: Custom state of ${id} never created, so cannot remove it`);
      throw new Error(`removeState: Custom state of ${id} never created, so cannot remove it`);
    }
    delete this.customStates[id];
    this.send({
      type: 'removeState',
      id,
    });
  }

  choiceUpdate(id:string, value:string) {
    if (value.length <= 0) {
      this.logIt('ERROR', 'choiceUpdate: value is an empty array');
      throw new Error('choiceUpdate: value is an empty array');
    }
    this.send({ type: 'choiceUpdate', id, value });
  }

  choiceUpdateSpecific(id:string, value:string[], instanceId:string) {
    if (value.length <= 0) {
      this.logIt('ERROR', 'choiceUpdateSpecific : value does not contain data in an array format');
      throw new Error(
        'choiceUpdateSpecific: value does not contain data in an array format',
      );
    }
    if (!instanceId || instanceId === '') {
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

  settingUpdate(name:string, value:string) {
    this.send({
      type: 'settingUpdate',
      name,
      value,
    });
  }

  stateUpdate(id:string, value:string) {
    this.send({ type: 'stateUpdate', id: id, value: value });
  }

  stateUpdateMany(states:state[]) {
    const stateArray: stateUpdate[] = [];

    if (states.length <= 0) {
      this.logIt('ERROR', 'stateUpdateMany : states contains no data');
      throw new Error('stateUpdateMany: states contains no data');
    }

    states.forEach((state) => {
      stateArray.push({
        type: 'stateUpdate',
        id: state.id,
        value: state.value,
      });
    });

    this.sendArray(stateArray);
  }

  connectorUpdate(id:string, value:string, data:dataItem[], isShortId:boolean = false) {
    this.send(this.buildConnectorUpdate(id, value, data, isShortId));
  }

  buildConnectorUpdate(id:string, value:string, data:dataItem[], isShortId:boolean) {
    const newValue = parseInt(value, 10);
    if (newValue < 0 || newValue > 100) {
      this.logIt('ERROR', `connectorUpdate: value has to be between 0 and 100 ${newValue}`);
      throw new Error(`connectorUpdate: value has to be between 0 and 100 ${newValue}`);
    }

    const connectorUpdateObj:connectorUpdate = {
      type: 'connectorUpdate',
      value: newValue.toString(),
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

  connectorUpdateMany(connectors:connector[]) {
    const connectorArray:connectorUpdate[] = [];

    if (connectors.length <= 0) {
      this.logIt('ERROR', 'connectorManyUpdate : connectors contains no data');
      throw new Error('connectorManyUpdate: connectors contains no data');
    }
    connectors.forEach((conn) => {
      const isShortId = conn.shortId !== undefined;
      conn.id = (isShortId && conn.shortId) ? conn.shortId : conn.id;
      connectorArray.push(this.buildConnectorUpdate(conn.id, conn.value, conn.data, isShortId));
    });
    this.sendArray(connectorArray);
  }

  updateActionData(actionInstanceId:string, data:action) {
    if (data.id === undefined || data.id === '' || data.minValue === undefined || data.minValue === '' || data.maxValue === undefined || data.maxValue === '' || data.type === undefined || data.type === '') {
      this.logIt('ERROR', 'updateActionData : required data is missing from instance', JSON.stringify(data));
      throw new Error(`updateActionData: required data is missing from instance. ${JSON.stringify(data)}`);
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

  sendNotification(notificationId:string, title:string, msg:string, optionsArray:notificationOption[]) {
    if (optionsArray === undefined || optionsArray.length <= 0) {
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

  sendArray(dataArray:object[]) {
    let dataStr = '';
    if (dataArray.length <= 0) {
      this.logIt('ERROR', 'sendArray : dataArray has no length');
      throw new Error('sendArray: dataArray has no length');
    }
    dataArray.forEach((element) => {
      dataStr = dataStr + JSON.stringify(element) + "\n";
    });

    if (dataStr == null) {
      return;
    }

    this.socket.write(dataStr);
  }

  send(data:object) {
    this.socket.write(JSON.stringify(data)+"\n");
  }

  pair() {
    const pairMsg = {
      type: 'pair',
      id: this.pluginId,
    };
    this.send(pairMsg);
  }

  checkForUpdate() {
    const parent = this;
    http.get(this.updateUrl, (res) => {
      const { statusCode } = res;

      // Any 2xx status code signals a successful response but
      // here we're only checking for 200.
      if (statusCode !== 200) {
        const error = new Error(`${this.pluginId}:ERROR: Request Failed.\nStatus Code: ${statusCode}`);
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
        parent.logIt('ERROR', 'error received attempting to check for update:', error);
      });
    }).on('error', (error) => {
      parent.logIt('ERROR', 'error received attempting to check for update:', error);
    });
  }

  connect(options:connectOptions = { pluginId: 'UNK'}) {
    const { pluginId, updateUrl } = options;
    this.pluginId = pluginId;
    const parent = this;

    if (updateUrl !== undefined) {
      this.updateUrl = updateUrl;
      this.checkForUpdate();
    }

    this.socket.setEncoding("utf8");
    this.socket.connect(SOCKET_PORT, SOCKET_IP, () => {
      parent.logIt('INFO', 'Connected to TouchPortal');
      parent.emit('connected');
      parent.pair();
    });

    this.socket.on('data', (data) => {
      const lines = data.toString().split(/(?:\r\n|\r|\n)/);

      lines.forEach((line) => {
        if (line === '') { return; }
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

  logIt(...args) {
    const curTime = new Date().toISOString();
    const message = args;
    const type = message.shift();
    console.log(curTime, ':', this.pluginId, `:${type}:`, message.join(' '));
  }
}