"use strict";

const EventEmitter = require("events");
const net = require("net");
const http = require("https");
const compareVersions = require('compare-versions');
const { requireFromAppRoot } = require('require-from-app-root');
const pluginVersion = requireFromAppRoot('package.json').version;

const SOCKET_IP = '127.0.0.1';
const SOCKET_PORT = 12136;

class TouchPortalClient extends EventEmitter {
  constructor(options = {}) {
    super();
    this.touchPortal = null;
    this.pluginId = null;
    this.socket = null;
    this.customStates = {};
  }

  createState(id, desc, defaultValue) {
    if (this.customStates[id]) {
      console.log(
        this.pluginId,
        `: ERROR : createState: Custom state of ${id} already created`
      );
      throw new Error(`createState: Custom state of ${id} already created`);
    }
    this.send({
      type: "createState",
      id: id,
      desc: desc,
      defaultValue: defaultValue,
    });
  }

  choiceUpdate(id, value) {
    if (value.length <= 0) {
      console.log(
        this.pluginId,
        ": ERROR : choiceUpdate: value is an empty array"
      );
      throw new Error("choiceUpdate: value is an empty array");
    }
    this.send({ type: "choiceUpdate", id: id, value: value });
  }

  choiceUpdateSpecific(id, value, instanceId) {
    if (value.length <= 0) {
      console.log(
        this.pluginId,
        ": ERROR : choiceUpdateSpecific : value does not contain data in an array format"
      );
      throw new Error(
        "choiceUpdateSpecific: value does not contain data in an array format"
      );
    }
    if (!instanceId || instanceId == "") {
      console.log(
        this.pluginId,
        ": ERROR : choiceUpdateSpecific : instanceId is not populated"
      );
      throw new Error("choiceUpdateSpecific: instanceId is not populated");
    }
    this.send({
      type: "choiceUpdate",
      id: id,
      instanceId: instanceId,
      value: value,
    });
  }

  settingUpdate(name,value){
    this.send({
      type: "settingUpdate",
      name: name,
      value: value
    });
  }

  stateUpdate(id, value) {
    this.send({ type: "stateUpdate", id: id, value: `${value}` });
  }

  stateUpdateMany(states) {
    let stateArray = [];

    if (states.length <= 0) {
      console.log(
        this.pluginId,
        ": ERROR : stateUpdateMany : states contains no data"
      );
      throw new Error("stateUpdateMany: states contains no data");
    }

    states.forEach((state) => {
      stateArray.push({
        type: "stateUpdate",
        id: state.id,
        value: `${state.value}`,
      });
    });

    this.sendArray(stateArray);
  }

  sendArray(dataArray) {
    let dataStr = "";
    if (dataArray.length <= 0) {
      console.log(
        this.pluginId,
        ": ERROR : sendArray : dataArray has no length"
      );
      throw new Error("sendArray: dataArray has no length");
    }
    dataArray.forEach((element) => {
      dataStr = dataStr + JSON.stringify(element) + "\n";
    });

    if (dataStr == null) {
      return;
    }

    this.socket.write(dataStr);
  }

  send(data) {
    this.socket.write(JSON.stringify(data) + "\n");
  }

  pair() {
    const pairMsg = {
      type: "pair",
      id: this.pluginId,
    };
    this.send(pairMsg);
  }

  checkForUpdate() {
		const that = this;
		http.get(this.updateUrl, (res) => {
			const { statusCode } = res;

			let error;
			// Any 2xx status code signals a successful response but
			// here we're only checking for 200.
			if (statusCode !== 200) {
				error = new Error(this.pluginId + ':ERROR: Request Failed.\n' + `Status Code: ${statusCode}`);
			}
			if (error) {
				console.log(error.message);
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
							that.emit('Update', pluginVersion, jsonData.version);
						}
					}
				}
				catch (e) {
					console.log(this.pluginId,":ERROR: Check for Update error=",e.message);
				}
			});
		});
	}

  connect(options = {}) {
    let { pluginId, updateUrl } = options;
    this.pluginId = pluginId;

    if ( updateUrl !== undefined ) {
		  this.updateUrl = updateUrl;
			this.checkForUpdate();
		}

    this.socket = new net.Socket();
    this.socket.setEncoding("utf-8");
    let that = this;
    this.socket.connect(SOCKET_PORT, SOCKET_IP, function () {
      console.log(that.pluginId, ": DEBUG : Connected to TouchPortal");
      that.emit("connected");
      that.pair();
    });

    this.socket.on("data", function (data) {

      let lines = data.split(/(?:\r\n|\r|\n)/);

      lines.forEach( (line) => {
        if( line == '' ) { return };
        const message = JSON.parse(line);

        //Handle internal TP Messages here, else pass to user code
        switch (message.type) {
          case "closePlugin":
            if (message.pluginId === that.pluginId) {
              that.emit("Close", message);
              console.log(
                that.pluginId,
                ": WARN : received Close Plugin message"
              );
              that.socket.end();
              process.exit(0);
            }
            break;
          case "info":
            console.log(that.pluginId, ": DEBUG : Info received");
            that.emit("Info", message);
            if( message.settings !== null ) {
                that.emit("Settings", message.settings)
            }
            break;
          case "settings":
            console.log(that.pluginId, ": DEBUG : Settings Update received");
            // values is the key that is the same as how info contains settings key, for direct settings saving
            that.emit("Settings", message.values);
            break;
          case "listChange":
            console.log(that.pluginId, ": DEBUG : ListChange received");
            that.emit("ListChange", message);
            break;
          case "action":
            console.log(that.pluginId, ": DEBUG : Action received");
            that.emit("Action", message, null);
            break;
          case "broadcast":
            console.log(that.pluginId, ": DEBUG : Broadcast Message received");
            that.emit("Broadcast", message);
            break;
          case "up":
            console.log(that.pluginId, ": DEBUG : Up Hold Message received");
            that.emit("Action", message, false);
            break;
          case "down":
            console.log(that.pluginId, ": DEBUG : Down Hold Message received");
            that.emit("Action", message, true);
            break;
          default:
            console.log(
              that.pluginId,
              `: DEBUG : Unhandled type received ${message.type}`
            );
            that.emit("Message", message);
        }
      });
    });
    this.socket.on("error", function () {
      console.log(that.pluginId, ": ERROR : Socket Connection closed");
      process.exit(0);
    });

    this.socket.on("close", function () {
      console.log(that.pluginId, ": WARN : Connection closed");
    });
  }
}

module.exports = TouchPortalClient;
