export enum TouchPortalIncomingEventType {
  ExecuteAction = 'action',
  ActionHoldInfo_Up = 'up',
  ActionHoldInfo_Down = 'down',
  ConnectorChange = 'connectorChange',
  ConnectorShortIdInfo = 'shortConnectorIdNotification',
  ListChanged = 'listChange',
  ClosePluginCall = 'closePlugin',
  Broadcast = 'broadcast',
  NotificationAction = 'notificationOptionClicked',
  Info = 'info',
  Settings = 'settings'
}
