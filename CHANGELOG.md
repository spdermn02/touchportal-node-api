# Touch Portal Node API - Change Log

## v3.2.1 - ESLint implementation and Typescript support
 ### Updates
  - Big thank you to riverrun-git for the PR's and the assitance
  - TypeScript support is just being implemented in increments, more support for it coming soon

---
## v3.2.0

  ### New Features:
    - Support for Parent Groups on State creation added in Touch Portal 3.1
  ### Fixes:
    - Fixed Spelling for `showNotification` type sent to Touch Portal, so now Notifications should work properly if you use them.
 
---
## v3.1.2
  ## New Features:
    - Added createStateMany function
      - This allows state creation to be batched together rather than one at a time.
  ## Fixes:
    - force id, desc, defaultValue on createState to send as a string
    - Fix update check process to error properly versus killing the process

--- 
## v3.1.1
  ### New Features:
    - Support for Short Ids for Connectors
      - Updated connectorUpdate function with additional flag to indicate if id is ShortId, default is false
      - Updated connectorUpdateMany function to take id, or shortId
      - Support for ConnectorShortIdNotification event

---
## v3.0.0
  ### New Features:
    - Support for new Connectors in to v3.0.0
      - Added connectorUpdate function
      - Added buildConnectorUpdate function
      - Added connectorUpdateMany function
      - Support for connectorChange event
    - Support for new Notification System in v3.0.0
      - Added sendNotification function
      - Support for notificationOptionClick event

---
## v2.1.1 
  ### Fixes:
    - Fixed issue with createState and removeState to setup using the object internally to keep track

---
## v2.1.0 
  ### New Features:
    - Updates to add in missed features from TouchPortal SDK v3 updates
    - Support for removeState message type
    - Support for updateActionData message type

---
## v2.0.0 - Updates to include new features from Touch Portal 2.3, minor enhancements, Fixes
  ### New Features:
    - Support for new TouchPortal Settings configuration
    - Support for On Hold events of Up and Down actions
    - Support for Broadcast messages from Touch Portal
    - Support to handle checking for updates against a remote package.json file for your project
    - UTF-8 encoding on the socket will help with non-standard ascii character issues
  ### Fixes:
    - Refactored Some code slightly
    - Refactored logging to a single method to output a consistent format
    - Fixed issue if multiple messages were received at the same time it could cause the json parse to fail and thus causing the code to throw and exception, so now it splits on newlines and works all messages that came in during the read in the order they came in
    - Fixed #5 Issue - forces ids and values to strings during stateUpdate and stateUpdateMany

---
## v1.0.6 
  ### Fixes:
    - Removing 5 second "wait" for socket close event to fire - no need for it - it is synchronous anyways

---
## v1.0.5 - bug fix for socket connection end

---
## v1.0.4 - End socket connection from the client side when a close message is received

---
## v1.0.3 - Fixes - fixing all the typeof checks that weren't correct, adding some console.log messages, and throwing new errors instead of just using throw
  ### New Features:
    - Create State functionality was added

---
## v1.0.2 - Documentation Update

---
## v1.0.1 - minor bug fix emite -> emit, log message update, and invalid variable definition fixed

---
## v1.0.0 - Initial Release of the API
