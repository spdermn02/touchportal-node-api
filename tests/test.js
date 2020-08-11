"use strict";

const TP = require("../src/index.js");

const pluginId = "TPExample";
const updateUrl =
  "https://raw.githubusercontent.com/spdermn02/touchportal-node-api/master/package.json";

const client = new TP.Client();
client.on("Action", (data) => {
  console.log("Action:", JSON.stringify(data));
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
client.on("Close", (data) => {
  console.log("Closing Plugin:", JSON.stringify(data));
});

client.connect({ pluginId, updateUrl });
