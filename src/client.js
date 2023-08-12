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
    this.pluginId = null;
    this.socket = null;
    this.customStates = {};
  }

  /**
   * Internal helper method for states that automatically manages self.customStates and sends the message to TouchPortal.
   * 
   * @param {Object[Object]} states - Array of object containing id,
   * desc, defaultValue, optionally parentGroup.
   * @param {String} stateType - TouchPortal state type removeState
   * or createState.
   * 
   * @return {void}
   */
  stateHelper(states, stateType) {
    const stateArray = [];
    if (!(typeof states == "object" || states.length)) {
      this.logIt('ERROR', `${stateType} has to be vaild object.`)
    }
    states.forEach((state) => {
      state.type = stateType;

      if (stateType === "createState") {
        if (this.customStates[state.id]) {
          this.logIt('ERROR', `createState: Custom state of ${state.id} already created`);
          throw new Error(`createState: Custom state of ${state.id} already created`);
        };
        this.customStates[state.id] = state.desc;
      } else if (stateType === "removeState") {
        if (!state.id) {
          this.logIt('ERROR', `removeState: ID parameter is empty`);
          throw new Error(`removeState: ID parameter is empty`);
        }
        delete this.customStates[state.id];
      }
      stateArray.push(state);
    })
    this.sendArray(stateArray);
  }

  /**
   * createState() allows you to create a state during runtime.
   * 
   * @param {String} id - unquie state id
   * @param {String} desc - description of the state
   * @param {String} defaultValue - default value for the state
   * @param {String} parentGroup - Optionally parentGroup
   * 
   * @return {void}
   */
  createState(id, desc, defaultValue, parentGroup) {
    this.stateHelper([{
        // @ts-ignore
        "id": id,
        "desc": desc,
        "defaultValue": defaultValue,
        "parentGroup": parentGroup
      }],
      "createState"
    )
  }

  /**
   * createStateMany() convenience function that
   * allows you to create several states at once.
   * 
   * @param {Array<Object>} states - An array of object contains
   * state id, state desc, defaultValue and optionally parentGroup.
   * 
   * @return {void}
   */
  createStateMany(states) {
    this.stateHelper(states, "createState")
  }

  /**
   * removeState() Allows you to remove certain states.
   * 
   * @param {String} id - state id state that you want to remove.
   * 
   * @return {void}
   */
  removeState(id) {
    // @ts-ignore
    this.stateHelper([{"id": id}], "removeState")
  }

  /**
   * removeStateMany() convenience function to remove
   * several states at once.
   * 
   * @param {Array<String>} states - A list of state id
   * 
   * @return {void}
   */
  removeStateMany(states) {
    this.stateHelper(states, "removeState")
  }

  /**
   * choiceUpdate() updates a choice data from a action.
   * 
   * @param {string} id - action choice data id
   * @param {Array<String>} value - array of string
   * 
   * @return {void}
   */
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

  /**
   * choiceUpdateSpecific() allows you to update a specific 
   * instances action data choices
   * 
   * @param {String} id - action choice data id
   * @param {Array<String>} value - Array of strings.
   * @param {string} instanceId - instanceId of the action
   * 
   * @return {void}
   */
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

  /**
   * settingUpdate() allows you to update your plugin settings.
   * 
   * @param {String} name - setting name
   * @param {String} value - new setting value
   * 
   * @return {void}
   */
  settingUpdate(name, value) {
    this.send({
      type: 'settingUpdate',
      name,
      value,
    });
  }

  /**
   * stateUpdate() allows you to update a states from the plugin either
   * created in entry.tp or dynamically created.
   * 
   * @param {String} id - state id
   * @param {String} value - a new value for the state.
   * 
   * @return {void}
   */
  stateUpdate(id, value) {
    this.send({ type: 'stateUpdate', id: `${id}`, value: `${value}` });
  }

  /**
   * stateUpdateMany() a method that allows you to update multiple
   * states at once
   * 
   * @param {Array<object>} states - An array of object containing state id
   * and state value
   * 
   * @return {void} 
   */
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

  /**
   * @param {String} id - connector id
   * @param {number} value - connector value from 0 to 100.
   * @param {Array<object>} data - An array of object containing
   * id and value
   * 
   * @return {Object}
   */
  buildConnectorUpdate(id, value, data, isShortId) {
    // @ts-ignore
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

  /**
   * @param {Array<Object>} connectors - An array list of object containing shortId
   * or normal connector id, value 0-100 and connector data.
   * 
   * @return {void}
   */
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

  /**
   * updateActionData() allows you dynamically update action data field
   * minValue and maxValue
   * 
   * @param {String} actionInstanceId - action instance Id
   * @param {Object} data - an object that contains minValue, maxValue, id and type
   * 
   * @return {void}
   */
  updateActionData(actionInstanceId, data) {
    if (!data.id || !data.type || typeof data.minValue !== 'number' || typeof data.maxValue !== 'number') {
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

  /**
   * sendNotification() this method allows your plugin to send
   * notification to TouchPortal with a custom title, message
   * actions buttons.
   * 
   * @param {String} notificationId - Unique ID of this notification
   * @param {String} title - The notification title
   * @param {String} msg - The message body text that is shown in the notification.
   * @param {Array<Object>} optionsArray - List of options (actions) for the
   * notification. Each options should be a object containing `id` and `title` keys.
   * 
   * @return {void}
   */
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

  /**
   * sendArray() Internal method that combines multiple TouchPortal messages into one and send it.
   * @param {Array<Object>} dataArray - An array of objects  
   * 
   * @return {void}
   */
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

  /**
   * send() Normally you wouldn't need to use this method directly, but if this library
   * does not cover something from TP api, this could be used instead.
   * @param {Object} data - TouchPortal socket message
   * 
   * @return {void}
   */
  send(data) {
    this.socket.write(JSON.stringify(data));
    this.socket.write('\n');
  }

  /**
   * pair() Internal helper method that sends pair message to TouchPortal. 
   * 
   * @return {void}
   */
  pair() {
    const pairMsg = {
      type: 'pair',
      id: this.pluginId,
    };
    this.send(pairMsg);
  }

  /**
   * checkForUpdate() A method that http request
   * to a Json that contains `version` key to compare.
   * 
   * @param {String} updateUrl - webpage url contains json
   * 
   * @return {void}
   */
  checkForUpdate(updateUrl) {
    const parent = this;
    http.get(updateUrl, (res) => {
      const { statusCode } = res;

      if (statusCode < 200 || statusCode > 299) {
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

  /**
   * connect() is main method that sets up TouchPortal connections 
   * and callbacks. 
   * 
   * @param {Object} options - options object that contains infomation about the plugin
   * @param {String} options.pluginId - pluginId - Plugind id that you've defined in entry.tp
   * @param {String} options.updateUrl - updateUrl - Optional url to remote entry.tp this is used to auto check for updates.
   * 
   * @returns {void}
   */
  connect(options) {
    const { pluginId, updateUrl } = options;
    this.pluginId = pluginId;
    const parent = this;

    if (updateUrl) {
      this.checkForUpdate(updateUrl);
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
              process.exit(0);
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
    console.log(curTime, ':', this.pluginId, `:${type}:`, ...message);
  }
}

module.exports = TouchPortalClient;
