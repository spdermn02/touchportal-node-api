"use strict";

const TP = require("../src/index.js");

const pluginId = "TPExample";

const client = new TP.Client();
client.on("Action", (data, isHeld) => {
  console.log("Action:", JSON.stringify(data), "isHeld=" + isHeld);
});
client.on("ListChange", (data) => {
  console.log("ListChange:", JSON.stringify(data));
});
client.on("Message", (data) => {
  console.log("Message:", JSON.stringify(data));
});
client.on("Info", (data) => {
  console.log("Info:", JSON.stringify(data));
});
client.on("Settings",(data) => {
  console.log("Info:", JSON.stringify(data));
});
client.on("ConnectorChange", (data) => {
  console.log("Info:", JSON.stringify(data));
});
client.on("Broadcast",(data) => {
  console.log("Info:", JSON.stringify(data));
})
client.on("Close", (data) => {
  console.log("Closing Plugin:", JSON.stringify(data));
});

client.connect({ pluginId });

