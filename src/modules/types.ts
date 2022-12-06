export type state = { id:string, value:string, desc:string, defaultValue: string, parentGroup?:string }

export type stateUpdate = { type:string, id:string, value:string }

export type connectorUpdate = { type:string, value:string, connectorId?:string, shortId?:string }

export type connectOptions = { pluginId: string, updateUrl?:string }

export type createState = {type: string, id: string, defaultValue: string, desc: string, parentGroup?:string }

export type dataItem = {id: string, value: string }

export type connector = { id: string, value:string, connectorId?:string, shortId?:string, data:dataItem[] } 

export type action = {id:string, minValue: string, maxValue: string, type: string }

export type notificationOption = {id:string,title:string}