/* eslint-disable @typescript-eslint/no-duplicate-enum-values */

export enum TouchPortalOutgoingRequestType {
  CreateAState = 'createState',
  CreateANotification = 'showNotification',
  UpdateState = 'stateUpdate',
  UpdateStateList = 'stateListUpdate',
  UpdateChoiceList = 'choiceUpdate',
  UpdateSpecificList = 'choiceUpdate',
  UpdateSpecificAction = 'updateActionData',
  UpdateSetting = 'settingUpdate',
  UpdateConnectorData = 'connectorUpdate',
  TriggerEvent = 'triggerEvent',
  RemoveState = 'removeState',
  Pair = 'pair'
}
