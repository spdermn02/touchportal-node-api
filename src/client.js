const EventEmitter = require('events');
const net = require('net');
const http = require('https');
const compareVersions = require('compare-versions');
const { requireFromAppRoot } = require('require-from-app-root');

const pluginVersion = requireFromAppRoot('package.json').version;

const SOCKET_IP = '127.0.0.1';
const SOCKET_PORT = 12136;
const CONNECTOR_PREFIX = 'pc';

class TouchPortalClient extends EventEmitter {
  constructor() {
    super();
    this.touchPortal = null;
    this.pluginId = null;
    this.socket = null;
    this.customStates = {};
  }

  createState(id, desc, defaultValue, parentGroup) {
    if (this.customStates[id]) {
      this.logIt('ERROR', `createState: Custom state of ${id} already created`);
      throw new Error(`createState: Custom state of ${id} already created`);
    }
    this.customStates[id] = desc;
    const newState = {
      type: 'createState',
      id: `${id}`,
      desc: `${desc}`,
      defaultValue: `${defaultValue}`,
    };
    if (parentGroup !== '' || parentGroup !== undefined) {
      newState.parentGroup = `${parentGroup}`;
    }
    this.send(newState);
  }

  createStateMany(states) {
    const createStateArray = [];

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
          id: `${state.id}`,
          desc: `${state.desc}`,
          defaultValue: `${state.defaultValue}`,
        };
        if (state.parentGroup !== '' || state.parentGroup !== undefined) {
          newState.parentGroup = `${state.parentGroup}`;
        }
        createStateArray.push(newState);
      }
    });

    this.sendArray(createStateArray);
  }

  removeState(id) {
    if (!id) {
      this.logIt('ERROR', `removeState: ID parameter is empty`);
      throw new Error(`removeState: ID parameter is empty`);
    }
    delete this.customStates[id];
    this.send({
      type: 'removeState',
      id,
    });
  }

  choiceUpdate(id, value) {
    if (!id) {
      this.logIt('ERROR', 'choiceUpdate: ID parameter is empty');
      throw new Error('choiceUpdate: ID parameter is empty');
    }
    if (!Array.isArray(value)) {
      this.logIt('ERROR', 'choiceUpdate : value parameter must be an array');
      throw new Error( 'choiceUpdate: value parameter must be an array');
    }
    this.send({ type: 'choiceUpdate', id, value });
  }

  choiceUpdateSpecific(id, value, instanceId) {
    if (!id) {
      this.logIt('ERROR', 'choiceUpdateSpecific: ID parameter is empty');
      throw new Error('choiceUpdateSpecific: ID parameter is empty');
    }
    if (!Array.isArray(value)) {
      this.logIt('ERROR', 'choiceUpdateSpecific : value parameter must be an array');
      throw new Error('choiceUpdateSpecific: value parameter must be an array');
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

  settingUpdate(name, value) {
    this.send({
      type: 'settingUpdate',
      name,
      value,
    });
  }

  stateUpdate(id, value) {
    this.send({ type: 'stateUpdate', id: `${id}`, value: `${value}` });
  }

  stateUpdateMany(states) {
    const stateArray = [];

    if (states.length <= 0) {
      this.logIt('ERROR', 'stateUpdateMany : states contains no data');
      throw new Error('stateUpdateMany: states contains no data');
    }

    states.forEach((state) => {
      stateArray.push({
        type: 'stateUpdate',
        id: `${state.id}`,
        value: `${state.value}`,
      });
    });

    this.sendArray(stateArray);
  }

  connectorUpdate(id, value, data, isShortId = false) {
    this.send(this.buildConnectorUpdate(id, value, data, isShortId));
  }

  buildConnectorUpdate(id, value, data, isShortId) {
    const newValue = parseInt(value, 10);
    if (newValue < 0 || newValue > 100) {
      this.logIt('ERROR', `connectorUpdate: value has to be between 0 and 100 ${newValue}`);
      throw new Error(`connectorUpdate: value has to be between 0 and 100 ${newValue}`);
    }

    const connectorUpdateObj = {
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

  connectorUpdateMany(connectors) {
    const connectorArray = [];

    if (connectors.length <= 0) {
      this.logIt('ERROR', 'connectorManyUpdate : connectors contains no data');
      throw new Error('connectorManyUpdate: connectors contains no data');
    }
    connectors.forEach((connector) => {
      const isShortId = connector.shortId !== undefined;
      connector.id = (isShortId) ? connector.shortId : connector.id;
      connectorArray.push(this.buildConnectorUpdate(connector.id, connector.value, connector.data, isShortId));
    });
    this.sendArray(connectorArray);
  }

  updateActionData(actionInstanceId, data) {
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

  sendNotification(notificationId, title, msg, optionsArray) {
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

  sendArray(dataArray) {
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

  send(data) {
    this.socket.write(JSON.stringify(data));
    this.socket.write('\n');
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

  connect(options = {}) {
    let { pluginId, updateUrl, exitOnClose } = options;
    this.pluginId = pluginId;
    const parent = this;

    if (typeof exitOnClose != 'boolean')
      exitOnClose = true;

    if (updateUrl) {
      this.updateUrl = updateUrl;
      this.checkForUpdate();
    }

    this.socket = new net.Socket();
    this.socket.setEncoding('utf-8');
    this.socket.connect(SOCKET_PORT, SOCKET_IP, () => {
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
              parent.socket.end();
            }
            break;
          case 'info':
            parent.emit('Info', message);
            if (message.settings) {
              parent.emit('Settings', message.settings);
            }
            break;
          case 'notificationOptionClicked':
            parent.emit('NotificationClicked', message);
            break;
          case 'settings':
            // values is the key that is the same as how info contains settings key, for direct settings saving
            parent.emit('Settings', message.values);
            break;
          case 'listChange':
            parent.emit('ListChange', message);
            break;
          case 'action':
            parent.emit('Action', message, null);
            break;
          case 'broadcast':
            parent.emit('Broadcast', message);
            break;
          case 'shortConnectorIdNotification':
            parent.emit('ConnectorShortIdNotification', message);
            break;
          case 'connectorChange':
            parent.emit('ConnectorChange', message);
            break;
          case 'up':
            parent.emit('Action', message, false);
            break;
          case 'down':
            parent.emit('Action', message, true);
            break;
          default:
            parent.emit('Message', message);
        }
      });
    });

    this.socket.on('error', (err) => {
      parent.logIt('ERROR', 'Socket Error', err.message);
    });

    this.socket.on('close', () => {
      parent.logIt('WARN', 'Connection closed');
      if (exitOnClose)
        process.exit(0);
    });
  }

  logIt(...args) {
    const curTime = new Date().toISOString();
    const message = args;
    const type = message.shift();
    console.log(curTime, ':', this.pluginId, `:${type}:`, ...message);
  }
}

module.exports = TouchPortalClient;
