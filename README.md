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
  Additions:
    - Create State functionality was added
v1.0.4 - End socket connection from the client side when a close message is received
v1.0.5 - bug fix for socket connection end
v1.0.6 - Removing 5 second "wait" for socket close event to fire - no need for it - it is synchronous anyways
v2.0.0 - Updates to include new features from Touch Portal 2.3, minor enhancements, bug fixes
  Additions:
    - Support for new TouchPortal Settings configuration
    - Support for On Hold events of Up and Down actions
    - Support for Broadcast messages from Touch Portal
    - Support to handle checking for updates against a remote package.json file for your project
  Updates:
    - Refactored Some code slightly
    - UTF-8 encoding on the socket will help with non-standard ascii character issues
    - Refactored logging to a single method to output a consistent format
  Bug Fixes:
    - Fixed issue if multiple messages were received at the same time it could cause the json parse to fail and thus causing the code to throw and exception, so now it splits on newlines and works all messages that came in during the read in the order they came in
    - Fixed #5 Issue - forces ids and values to strings during stateUpdate and stateUpdateMany
v2.1.0 - Updates to add in missed features from TouchPortal SDK v3 updates
  Additions:
    - Support for removeState message type
    - Support for updateActionData message type
v2.1.1 - Fixed issue with createState and removeState to setup using the object internally to keep track
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

// Object to hold actionId of held actions
let heldAction = {};

// Dynamic Actions Documentation: https://www.touch-portal.com/api/index.php?section=dynamic-actions

// Receive an Action Call from Touch Portal
TPClient.on("Action", (data,hold) => {

  //hold parameter can be undefined, true or false
  // undefined => was from "On Press" or "On Event"
  // true => was from "On Hold" down (being held) trigger
  // false => was from "On Hold" up (being let go) trigger

  //Track the action being held
  if( hold ) {
    heldAction[message.actionId] = true;
  }
  else if ( !hold ) {
    delete heldAction[message.actionId];
  }

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

  //Example Hold action handler
  let adjustVol = parseInt(message.data[0].value,10);
  while( hold === undefined || heldAction[message.actionId] ) {

    //Do Action here that can be repeated

    //Will cause a 100ms wait
    await new Promise(r => setTimeout(r,100));
    
    // If we aren't holding(so just a keypress) or we no longer are being held, break this loop
    if( hold === undefined || !heldAction[message.actionId] ) { break; }
  }

  ...

  // Once your action is done, send a State Update back to Touch Portal
  TPClient.stateUpdate("<state id>", "value", data.InstanceId);

  // If you have multiple states to send back, you can do that in one call versus separate
  let states = [
    { id: "<state id1>", value: "value"},
    { id: "<state id2>", value: "value1"}
  ];
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

   // type: number is all that is supported at the moment
   TPClient.updateActionData(data.instanceId,{id: "unique_id",type:"number",minValue: 1, maxValue: 10})

});

// After join to Touch Portal, it sends an info message
// handle it here
TPClient.on("Info",(data) => {

    //Do something with the Info message here
    // NOTE: the "settings" section is already handled and will emit the Settings event, no need to duplicate here, just documenting since it is part of the info message
    /*
        {
            "type":"info",
            "settings":[{"Setting 1":"Value 1"},...,],
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

TPClient.on("Broadcast",(data) = > {

  // If you want to handle page change events - this is what happens
  // more info here: https://www.touch-portal.com/api/index.php?section=dynamic-actions

  /* 
    {"type":"broadcast",
     "event":"pageChange",
     "pageName":"name of the page switched to"
    }
  */
  
});

TPClient.on("Settings",(data) => {

    //Do something with the Settings message here
    // Note: this can be called any time settings are modified or saved in the TouchPortal Settings window.
    /* 
      [{"Setting 1":"Value 1"},{"Setting 2":"Value 2"},...,{"Setting N":"Value N"}]
    */

    // Will throw an exception if/when stateIdToRemove has not been created by the Plugin
    TPClient.removeState("stateIdToRemove");
});

TPClient.on("Update",(curVersion, remoteVersion) => {

    // Do something to indicate to your user there is an update
    // Open a localhost page, navigate them to the repo about the update, whatever you want to do.
    // Note: this is only checked on startup of the application and will not inform users of update until a full restart of Touch Portal or the plugin itself.

});

//Connects and Pairs to Touch Portal via Sockete
TPClient.connect({ pluginId });

//If you want touchportal-node-api to check for updates on startup, 
TPClient.connect({ pluginId, "updateUrl":"<url to remote entry.tp file>" });

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