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

  createState(id,desc,defaultvalue){
    if( this.customStates[id] ) {
      throw `createState: Custom state of ${id} already created`;
    }
    this.send({ type: "createState", id: id, desc: desc, defaultValue: defaultValue });
  }

  choiceUpdate(id, value) {
    if (typeof value != "array") {
      throw "choiceUpdate: value is not of type array";
    }
    this.send({ type: "choiceUpdate", id: id, value: value });
  }

  choiceUpdateSpecific(id, value, instanceId) {
    if (typeof value != "array") {
      throw "choiceUpdate: value is not of type array";
    }
    if (!instanceId || instanceId == "") {
      throw "choiceUpdate: instanceId is not populated";
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

    if (typeof states != "array") {
      throw "stateUpdateMany: states is not of type array";
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
    let dataStr = null;
    if (typeof dataArray != "array") {
      throw "dataArray is not of type array";
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
    console.log(this.pluginId);
    this.socket = new net.Socket();
    let that = this;
    this.socket.connect(12136, "127.0.0.1", function () {
      console.log("Connected to TouchPortal", that.pluginId);
      that.emit("connected");
      that.pair();
    });

    this.socket.on("data", function (data) {
      const message = JSON.parse(data);

      //Handle internal TP Messages here, else pass to user code
      switch (message.type) {
        case "closePlugin":
          console.log(message.pluginId, that.pluginId);
          if (message.pluginId === that.pluginId) {
            that.emit("Close", message);
            console.log("received Close Plugin message, exiting in 5 seconds");
            setTimeout(() => {
              process.exit(9);
            }, 5000);
          }
          break;
        case "info":
          console.log("Info received");
          that.emit("Info", message);
          break;
        case "listChange":
          console.log("ListChange received");
          that.emite("ListChange", message);
          break;
        case "action":
          console.log("Action received");
          that.emit("Action", message);
          break;
        default:
          that.emit("Message", message);
      }
    });

    this.socket.on("close", function () {
      console.log("Connection closed");
    });
  }
}

module.exports = TouchPortalClient;
