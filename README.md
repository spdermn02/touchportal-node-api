# Touch Portal API for Node.JS

Build a plugin to Touch Portal with Node.JS utlizing this easy to use library.  No need to understand the inner workings of the Touch Portal Socket connection, just install this package, and connect!

- [Touch Portal API for Node.JS](#touch-portal-api-for-nodejs)
  - [ChangeLog](#changelog)
  - [Usage](#usage)
    - [Install using npm](#install-using-npm)
    - [How To Use](#how-to-use)
  - [Full Touch Portal API Documentation](#full-touch-portal-api-documentation)
- [Support](#support)
- [Bugs](#bugs)
- [Contribute](#contribute)
- [Touch Portal](#touch-portal)

*NOTE*: Make sure your Touch Portal is up-to-date to use the latest features.

## ChangeLog
```
v1.0.0 - Initial Release of the API
v1.0.1 - minor bug fix emite -> emit, log message update, and invalid variable definition fixed
v1.0.2 - Documentation Update
v1.0.3 - Bug Fixes - fixing all the typeof checks that weren't correct, adding some console.log messages, and throwing new errors instead of just using throw
v1.0.4 - End socket connection from the client side when a close message is received
v1.0.5 - bug fix for socket connection end
```

## Usage 
### Install using npm
```shell
npm install --save touchportal-api
```
### How To Use
What is described below, is pretty basic functionality, the usage of the below is very basic, and not intended to describe the full complexity of a plugin.
```javascript
const TouchPortalAPI = require('touchportal-api');

// Create an instance of the Touch Portal Client
const TPClient = new TouchPortalAPI.Client();

// Define a pluginId, matches your entry.tp file
const pluginId = 'TPExamplePlugin';

// Dynamic Actions Documentation: https://www.touch-portal.com/api/index.php?section=dynamic-actions

// Receive an Action Call from Touch Portal
TPClient.on("Action", (data) => {

    //An action was triggered, handle it here
    /*
        {
            "type":"action",
            "pluginId":"id of the plugin",
            "actionId":"id of the action",
            "data": [
                {
                "id":"data object id",
                "value":"user specified data object value",
                },
                {
                "id":"data object id",
                "value":"user specified data object value",
                }
            ]
        }
    */

    ...

    // Once your action is done, send a State Update back to Touch Portal
    TPClient.stateUpdate("<state id>", "value", data.InstanceId);

    // If you have multiple states to send back, you can do that in one call versus separate
    let states = [
        { id: "<state id1>", value: "value"},
        { id: "<state id2>", value: "value1"}
    ]
    TPClient.stateUpdateMany(states);
});

TPClient.on("ListChange",(data) => {
    // An Action's List dropdown changed, handle it here
    /*
        {
            "type":"listChange",
            "pluginId":"id of the plugin",
            "actionId":"id of the action",
            "listId":"id of the list being used in the inline action",
            "instanceId":"id of the instance",
            "value":"newValue",
        }
    */

   ...

   // Now send choiceUpdateSpecific based on listChange value
   TPClient.choiceUpdateSpecific("<state id>","value",data.instanceId)

});

// After join to Touch Portal, it sends an info message
// handle it here
TPClient.on("Info",(data) => {

    //Do something with the Info message here
    /*
        {
            "type":"info",
            "sdkVersion":"(SDK version code)"
            "tpVersionString":"(Version of Touch Portal in string format)"
            "tpVersionCode":"(Version of Touch Portal in code format)"
            "pluginVersion":"(Your plug-in version)"
        }
    */

    // Read some data about your program or interface, and update the choice list in Touch Portal

    TPClient.choiceUpdate("<state id>",["choice1","choice2"]);

    // Dynamic State additions - for use when you want control over what states are available in TouchPortal
    TPClient.createState("<new state id>","Description","Default Value");

});

//Connects and Pairs to Touch Portal via Sockete
TPClient.connect({ pluginId });

```

## Full Touch Portal API Documentation
Touch Portal interface Documentation here: 
[Touch Portal Interface Documentation](https://www.touch-portal.com/api)

# Support
If you need support, drop a question in the github issues tab, and I'll get to it as soon as possible.

# Bugs
Please report bugs using the github issues tab

# Contribute
Feel free to fork this repo and suggest pull requests. I cannot guarantee they will be included, but I'm definitely open to changes, enhancements, bug fixes!

# Touch Portal
If you got here, and are like "WTF is this?" it is for integrating custom functionality as a Touch Portal plugin. check out https://touch-portal.com to learn more about Touch Portal and it's amazing features and community.