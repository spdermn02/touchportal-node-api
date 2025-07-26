import { describe, expect, Mock, test, vi } from 'vitest';
import { getMockSocketFrom } from './mocks/mock-socket';
import {
  TouchPortalOutgoingRequestType,
  type PairRequest,
  type TouchPortalClientOptions,
  type TouchPortalConnectOptions
} from '../src/types';
import TouchPortalClient from '../src/client';

describe('connect', () => {
  const pluginId: string = 'test.plugin';
  const logCallback: Mock = vi.fn();
  const defaultConstructorOptions: TouchPortalClientOptions = { pluginId, logCallback };

  test.each([
    null,
    undefined,
    {},
    { pluginId: null },
    { pluginId: undefined },
    { pluginId: '' }
  ] as TouchPortalConnectOptions[])('throws if "pluginId" is invaid value', (options) => {
    const client = new TouchPortalClient({ logCallback });

    expect(() => client.connect(options)).toThrow('connect: pluginId is missing or empty.');
  });

  test('on connect emits "connected" event', () => {
    const listener = vi.fn();
    const client = new TouchPortalClient(defaultConstructorOptions);
    client.on('connected', listener);

    const mockSocket = getMockSocketFrom(() => client.connect());

    expect(mockSocket.connect).toHaveBeenCalled();
    expect(listener).toHaveBeenCalled();
  });

  test('on connect sends "pair" request', () => {
    const expectedPairRequest: PairRequest = { type: TouchPortalOutgoingRequestType.Pair, id: pluginId };
    const client = new TouchPortalClient(defaultConstructorOptions);
    const mockSocket = getMockSocketFrom(() => client.connect());

    expect(mockSocket.connect).toHaveBeenCalled();
    expect(mockSocket.write).toHaveBeenCalled();
    expect(mockSocket.write.mock.calls).toEqual([[JSON.stringify(expectedPairRequest)], ['\n']]);
  });

  describe('event handling', () => {
    test('on "data" should handle partial messages', () => {
      const listener = vi.fn();
      const client = new TouchPortalClient(defaultConstructorOptions);
      client.on('Message', listener);

      const mockSocket = getMockSocketFrom(() => client.connect());
      mockSocket.emit('data', '{"id":');
      mockSocket.emit('data', '123}\n');

      expect(listener).toHaveBeenCalledWith({ id: 123 });
    });

    test('on "data" should handle multiple messages', () => {
      const listener = vi.fn();
      const client = new TouchPortalClient(defaultConstructorOptions);
      client.on('Message', listener);

      const mockSocket = getMockSocketFrom(() => client.connect());
      mockSocket.emit('data', '{"id":1}\n{"id":2}\n');

      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenCalledWith({ id: 1 });
      expect(listener).toHaveBeenCalledWith({ id: 2 });
    });

    test('on "error" emits "socketError" event', () => {
      const listener = vi.fn();
      const client = new TouchPortalClient(defaultConstructorOptions);
      client.on('socketError', listener);

      const testError = new Error('Test socket failure');
      const mockSocket = getMockSocketFrom(() => client.connect());
      mockSocket.emit('error', testError);

      expect(listener).toHaveBeenCalledWith(testError);
    });

    test.each([true, false])('on "close" emits "disconnected" event', (hasError) => {
      const listener = vi.fn();
      const client = new TouchPortalClient(defaultConstructorOptions);
      client.on('disconnected', listener);

      const mockSocket = getMockSocketFrom(() => client.connect({ exitOnClose: false }));
      mockSocket.emit('close', hasError);

      expect(listener).toHaveBeenCalledWith(hasError);
    });

    test.each([
      { shouldCallExit: true },
      { options: null, shouldCallExit: true },
      { options: {}, shouldCallExit: true },
      { options: { exitOnClose: true }, shouldCallExit: true },
      { options: { exitOnClose: false }, shouldCallExit: false }
    ])('on "close" should handle exiting the process', ({ options, shouldCallExit }) => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('exit');
      });

      const client = new TouchPortalClient(defaultConstructorOptions);
      const mockSocket = getMockSocketFrom(() => client.connect(options as TouchPortalConnectOptions));

      if (shouldCallExit) {
        expect(() => mockSocket.emit('close', false)).toThrow('exit');
        expect(exitSpy).toHaveBeenCalledWith(0);
      } else {
        expect(() => mockSocket.emit('close', false)).not.toThrow('exit');
        expect(exitSpy).not.toBeCalled();
      }

      exitSpy.mockRestore();
    });

    describe('touch portal events', () => {
      describe('closePlugin', () => {
        test.each([
          { type: 'closePlugin' },
          { type: 'closePlugin', pluginId: null },
          { type: 'closePlugin', pluginId: '' },
          { type: 'closePlugin', pluginId: 'test.anotherPlugin' }
        ])('"closePlugin" should ignore if message pluginId differs', (message) => {
          const listener = vi.fn();
          const client = new TouchPortalClient(defaultConstructorOptions);
          client.on('Close', listener);

          const mockSocket = getMockSocketFrom(() => client.connect());
          mockSocket.emit('data', `${JSON.stringify(message)}\n`);

          expect(listener).not.toBeCalled();
        });

        test('"closePlugin" should emit "close" event', () => {
          const listener = vi.fn();
          const client = new TouchPortalClient(defaultConstructorOptions);
          client.on('Close', listener);

          const message = { type: 'closePlugin', pluginId };
          const mockSocket = getMockSocketFrom(() => client.connect());
          mockSocket.emit('data', `${JSON.stringify(message)}\n`);

          expect(listener).toHaveBeenCalledWith(message);
        });

        test('"closePlugin" should disconnect the socket', () => {
          const client = new TouchPortalClient(defaultConstructorOptions);
          const message = { type: 'closePlugin', pluginId };
          const mockSocket = getMockSocketFrom(() => client.connect());
          mockSocket.emit('data', `${JSON.stringify(message)}\n`);

          expect(mockSocket.end).toHaveBeenCalled();
        });
      });

      describe('info', () => {
        test('"info" should emit "Info" event', () => {
          const listener = vi.fn();
          const client = new TouchPortalClient(defaultConstructorOptions);
          client.on('Info', listener);

          const message = { type: 'info' };
          const mockSocket = getMockSocketFrom(() => client.connect());
          mockSocket.emit('data', `${JSON.stringify(message)}\n`);

          expect(listener).toHaveBeenCalledWith(message);
        });

        test.each([
          { message: { type: 'info' }, shouldEmitSettings: false },
          { message: { type: 'info', settings: undefined }, shouldEmitSettings: false },
          { message: { type: 'info', settings: null }, shouldEmitSettings: false },
          { message: { type: 'info', settings: {} }, shouldEmitSettings: true },
          { message: { type: 'info', settings: { setting: 'value' } }, shouldEmitSettings: true }
        ])('"info" emits "Settings" event', ({ message, shouldEmitSettings }) => {
          const listener = vi.fn();
          const client = new TouchPortalClient(defaultConstructorOptions);
          client.on('Settings', listener);

          const mockSocket = getMockSocketFrom(() => client.connect());
          mockSocket.emit('data', `${JSON.stringify(message)}\n`);

          if (shouldEmitSettings) {
            expect(listener).toHaveBeenCalledWith(message.settings);
          } else {
            expect(listener).not.toBeCalled();
          }
        });
      });

      describe('notificationOptionClicked', () => {
        test('"notificationOptionClicked" should emit "NotificationClicked" event', () => {
          const listener = vi.fn();
          const client = new TouchPortalClient(defaultConstructorOptions);
          client.on('NotificationClicked', listener);

          const message = { type: 'notificationOptionClicked' };
          const mockSocket = getMockSocketFrom(() => client.connect());
          mockSocket.emit('data', `${JSON.stringify(message)}\n`);

          expect(listener).toHaveBeenCalledWith(message);
        });
      });

      describe('settings', () => {
        test.each([
          { type: 'settings' },
          { type: 'settings', values: null },
          { type: 'settings', values: {} },
          { type: 'settings', values: { setting: 'value' } }
        ])('"settings" should emit "Settings" event', (message) => {
          const listener = vi.fn();
          const client = new TouchPortalClient(defaultConstructorOptions);
          client.on('Settings', listener);

          const mockSocket = getMockSocketFrom(() => client.connect());
          mockSocket.emit('data', `${JSON.stringify(message)}\n`);

          expect(listener).toHaveBeenCalledWith(message.values);
        });
      });

      describe('listChange', () => {
        test('"listChange" should emit "ListChange" event', () => {
          const listener = vi.fn();
          const client = new TouchPortalClient(defaultConstructorOptions);
          client.on('ListChange', listener);

          const message = { type: 'listChange' };
          const mockSocket = getMockSocketFrom(() => client.connect());
          mockSocket.emit('data', `${JSON.stringify(message)}\n`);

          expect(listener).toHaveBeenCalledWith(message);
        });
      });

      describe('action', () => {
        test('"action" should emit "Action" event', () => {
          const listener = vi.fn();
          const client = new TouchPortalClient(defaultConstructorOptions);
          client.on('Action', listener);

          const message = { type: 'action' };
          const mockSocket = getMockSocketFrom(() => client.connect());
          mockSocket.emit('data', `${JSON.stringify(message)}\n`);

          expect(listener).toHaveBeenCalledWith(message, null);
        });
      });

      describe('broadcast', () => {
        test('"broadcast" should emit "Broadcast" event', () => {
          const listener = vi.fn();
          const client = new TouchPortalClient(defaultConstructorOptions);
          client.on('Broadcast', listener);

          const message = { type: 'broadcast' };
          const mockSocket = getMockSocketFrom(() => client.connect());
          mockSocket.emit('data', `${JSON.stringify(message)}\n`);

          expect(listener).toHaveBeenCalledWith(message);
        });
      });

      describe('shortConnectorIdNotification', () => {
        test('"shortConnectorIdNotification" should emit "ConnectorShortIdNotification" event', () => {
          const listener = vi.fn();
          const client = new TouchPortalClient(defaultConstructorOptions);
          client.on('ConnectorShortIdNotification', listener);

          const message = { type: 'shortConnectorIdNotification' };
          const mockSocket = getMockSocketFrom(() => client.connect());
          mockSocket.emit('data', `${JSON.stringify(message)}\n`);

          expect(listener).toHaveBeenCalledWith(message);
        });
      });

      describe('connectorChange', () => {
        test('"connectorChange" should emit "ConnectorChange" event', () => {
          const listener = vi.fn();
          const client = new TouchPortalClient(defaultConstructorOptions);
          client.on('ConnectorChange', listener);

          const message = { type: 'connectorChange' };
          const mockSocket = getMockSocketFrom(() => client.connect());
          mockSocket.emit('data', `${JSON.stringify(message)}\n`);

          expect(listener).toHaveBeenCalledWith(message);
        });
      });

      describe('up', () => {
        test('"up" should emit "Action" event', () => {
          const listener = vi.fn();
          const client = new TouchPortalClient(defaultConstructorOptions);
          client.on('Action', listener);

          const message = { type: 'up' };
          const mockSocket = getMockSocketFrom(() => client.connect());
          mockSocket.emit('data', `${JSON.stringify(message)}\n`);

          expect(listener).toHaveBeenCalledWith(message, false);
        });
      });

      describe('down', () => {
        test('"down" should emit "Action" event', () => {
          const listener = vi.fn();
          const client = new TouchPortalClient(defaultConstructorOptions);
          client.on('Action', listener);

          const message = { type: 'down' };
          const mockSocket = getMockSocketFrom(() => client.connect());
          mockSocket.emit('data', `${JSON.stringify(message)}\n`);

          expect(listener).toHaveBeenCalledWith(message, true);
        });
      });

      describe('unhandled type', () => {
        test.each([{}, { type: undefined }, { type: null }, { type: '' }, { type: 'unknown' }])(
          '"down" should emit "Message" event',
          (message) => {
            const listener = vi.fn();
            const client = new TouchPortalClient(defaultConstructorOptions);
            client.on('Message', listener);

            const mockSocket = getMockSocketFrom(() => client.connect());
            mockSocket.emit('data', `${JSON.stringify(message)}\n`);

            expect(listener).toHaveBeenCalledWith(message);
          }
        );
      });
    });
  });
});
