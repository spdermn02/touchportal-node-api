"use strict";

const EventEmitter = require("events");
const net = require("net");

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

  stateUpdate(id, value) {
    this.send({ type: "stateUpdate", id: id, value: value });
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
        value: state.value,
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

  connect(options = {}) {
    let { pluginId } = options;
    this.pluginId = pluginId;
    this.socket = new net.Socket();
    let that = this;
    this.socket.connect(12136, "127.0.0.1", function () {
      console.log(that.pluginId, ": DEBUG : Connected to TouchPortal");
      that.emit("connected");
      that.pair();
    });

    this.socket.on("data", function (data) {
      const message = JSON.parse(data);

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
            process.exit(9);
          }
          break;
        case "info":
          console.log(that.pluginId, ": DEBUG : Info received");
          that.emit("Info", message);
          break;
        case "listChange":
          console.log(that.pluginId, ": DEBUG : ListChange received");
          that.emit("ListChange", message);
          break;
        case "action":
          console.log(that.pluginId, ": DEBUG : Action received");
          that.emit("Action", message);
          break;
        default:
          console.log(
            that.pluginId,
            `: DEBUG : Unhandled type received ${message.type}`
          );
          that.emit("Message", message);
      }
    });

    this.socket.on("close", function () {
      console.log(this.pluginId, ": WARN : Connection closed");
    });
  }
}

module.exports = TouchPortalClient;
