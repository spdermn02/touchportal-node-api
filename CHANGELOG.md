# Touch Portal Node API - Change Log

## v3.3.0
  ### New Features:
  - Allow plugin "stateful" disconnection/exit ([#36]):
    - Added `exitOnClose` option to `connect()` method to control if client automatically calls `process.exit(0)` upon socket error/close (default is `true`).
    - Added `disconnected` event with `hadError <boolean>` parameter passed on from socket's `close` event (`true` if the socket had a transmission error).
    - Added `socketError` event with `err <Error>` parameter passed on from socket's `error` event.
    - Added `disconnect()` method which closes any current connection with `socket.end()`.
  -  Logging output can now be directed to a custom callback function instead of `console.log()` or disabled entirely (see PR [#38] for details):

  ### Fixes
  - Fixed handling of incoming messages from TP when the complete data could not fit into the client socket's buffer at the same time. This could happen on very long messages (with lots of data in an action), or when messages get queued in the operating system's buffer w/out being read, for example when plugin is paused in debugger or otherwise spends a long time being unresponsive. ([#40])

  ### Changes
  - `TouchPortalClient` constructor now accepts an optional `options` object argument with the following properties:
    - `pluginId` - Can be specified here instead of in the `connect()` method.
    - `captureRejections` - Passed through to `EventEmitter`.
    - `logCallback` - Can be a callback function or `null` to disable logging (see PR [#38] for details).
  - An exception is now thrown (and logged) if `pluginId` is empty when `connect()` is invoked. ([#38])
  - `removeState()` no longer validates that the state exists before sending the command to TP (allows removing states after a plugin restart, for example). ([#33])
  - `choiceUpdate()` and `choiceUpdateSpecific()` now allow sending an empty array of choices. ([#34])
  - `logIt()` method now allows direct passthrough of object to `console.log()` (or configured callback) without strignifying anything explicitly. ([#32])
  - Minor performance improvements whith reading and writing socket data strings. ([#31], [#40])

  ### Package
  - GitHub URL can now be used as a _package.json_ dependency specification instead of NPM. ([#35])
  - Updated various dependencies to newer versions. ([#39], [#41])

[#31]: https://github.com/spdermn02/touchportal-node-api/pull/31
[#32]: https://github.com/spdermn02/touchportal-node-api/pull/32
[#33]: https://github.com/spdermn02/touchportal-node-api/pull/33
[#34]: https://github.com/spdermn02/touchportal-node-api/pull/34
[#35]: https://github.com/spdermn02/touchportal-node-api/pull/35
[#36]: https://github.com/spdermn02/touchportal-node-api/pull/36
[#38]: https://github.com/spdermn02/touchportal-node-api/pull/38
[#39]: https://github.com/spdermn02/touchportal-node-api/pull/39
[#40]: https://github.com/spdermn02/touchportal-node-api/pull/40
[#41]: https://github.com/spdermn02/touchportal-node-api/pull/41

---
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
