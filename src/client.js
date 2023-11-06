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
  /**
   * Creates a new `TouchPortalClient` instance.
   * @param {Object} [options] Optional runtime settings for TouchPortalClient and EventEmitter.
   * @param {boolean} [options.captureRejections]
   *   Passed through to {@linkcode https://nodejs.org/docs/latest/api/events.html#class-eventemitter EventEmitter} constructor.
   * @param {string} [options.pluginId] ID of the plugin using this client, matching the definition in `entry.tp`.
   *   Also used in logging output. If omitted here then must be specified in `connect()` method options instead.
   * @param {(function(string, string | any, ...any?):void) | null} [options.logCallback]
   *   Log callback function called by `logIt()` method instead of `console.log()`, or `null` to disable logging.
   *
   *  Arguments passed to callback:
   *     * `level: string` - Logging level string, eg. "DEBUG"/"INFO"/"WARN"/"ERROR".
   *     * `message?: string | any` - The log message or some other value type to log, possibly `undefined`.
   *     * `...args: any[]` - Possible further argument(s) passed to the callback if logIt() was called with > 2 arguments.
   * @constructs {TouchPortalClient}
   */
  constructor(options = {}) {
    //@ts-ignore   TS doesn't seem to have proper typing for Node's EventEmitter c'tor which accepts an options object
    super(options);
    this.touchPortal = null;
    this.pluginId = options?.pluginId;
    this.socket = null;
    this.customStates = {};
    if (options && (options.logCallback === null || typeof options.logCallback == 'function'))
        this.logCallback = options.logCallback;
    else
        this.logCallback = undefined;
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

    if (pluginId)
      this.pluginId = pluginId;
    if (!this.pluginId) {
      this.logIt('ERROR', "connect: Plugin ID is missing or empty.");
      throw new Error('connect: Plugin ID is missing or empty.');
    }

    if (typeof exitOnClose != 'boolean')
      exitOnClose = true;

    if (updateUrl) {
      this.updateUrl = updateUrl;
      this.checkForUpdate();
    }

    const parent = this;

    this.socket = new net.Socket();
    this.socket.setEncoding('utf8');
    this.socket.connect(SOCKET_PORT, SOCKET_IP, () => {
      parent.emit('connected');
      parent.pair();
    });

    // Set up a buffer to potentially store partial incoming messages.
    let lineBuffer = "";
    this.socket.on('data',
      /** @param {string} data is a String type since we set an encoding on the socket (VSCode thinks it's a Buffer). */
      (data) =>
    {
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
        pos = n + 1;  // advance next newline search position
        lineBuffer = "";  // we're done with the line buffer

        // Try to decode the message.
        let message;
        try {
          message = JSON.parse(line);
        }
        catch (ex) {
          parent.logIt('ERROR', 'JSON exception while parsing line:', line, '\n', ex);
          continue;
        }

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
      }

    });

    this.socket.on('error', (err) => {
      parent.emit('socketError', err);
      parent.logIt('ERROR', 'Socket Error', err.message);
    });

    this.socket.on('close', (hadError) => {
      parent.emit('disconnected', hadError);
      parent.logIt('WARN', 'Connection closed');
      if (exitOnClose)
        process.exit(0);
    });
  }

  disconnect() {
    if (this.socket && !this.socket.destroyed)
      this.socket.end();
  }

  logIt(...args) {
    // must be a strict compare
    if (this.logCallback === undefined) {
      console.log(`${new Date().toISOString()} : ${this.pluginId} :${args.shift()}:`, ...args);
    }
    else if (this.logCallback) {
      this.logCallback(args.shift(), args.shift(), ...args);
    }
  }
}

module.exports = TouchPortalClient;
