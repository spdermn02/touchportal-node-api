/// <reference types="node" />
export = TouchPortalClient;
declare class TouchPortalClient extends EventEmitter {
    touchPortal: any;
    pluginId: any;
    socket: net.Socket;
    customStates: {};
    createState(id: any, desc: any, defaultValue: any, parentGroup: any): void;
    createStateMany(states: any): void;
    removeState(id: any): void;
    choiceUpdate(id: any, value: any): void;
    choiceUpdateSpecific(id: any, value: any, instanceId: any): void;
    settingUpdate(name: any, value: any): void;
    stateUpdate(id: any, value: any): void;
    stateUpdateMany(states: any): void;
    connectorUpdate(id: any, value: any, data: any, isShortId?: boolean): void;
    buildConnectorUpdate(id: any, value: any, data: any, isShortId: any): {
        type: string;
        value: number;
    };
    connectorUpdateMany(connectors: any): void;
    updateActionData(actionInstanceId: any, data: any): void;
    sendNotification(notificationId: any, title: any, msg: any, optionsArray: any): void;
    sendArray(dataArray: any): void;
    send(data: any): void;
    pair(): void;
    checkForUpdate(): void;
    connect(options?: {}): void;
    updateUrl: any;
    logIt(...args: any[]): void;
}
import EventEmitter = require("events");
import net = require("net");
//# sourceMappingURL=client.d.ts.map