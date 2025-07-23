import {
  describe,
  expect,
  Mock,
  test,
  vi
} from 'vitest';
import { getMockSocketFrom } from './mocks/mock-socket';
import TouchPortalClient from '../src/client';
import { TouchPortalClientOptions } from '../src/types';

describe('disconnect', () => {
  const pluginId: string = 'test.plugin';
  const logCallback: Mock = vi.fn();
  const defaultConstructorOptions: TouchPortalClientOptions = { pluginId, logCallback };

  test('should call socket.end() if socket exists and is not destroyed', () => {
    const client = new TouchPortalClient(defaultConstructorOptions);
    const socket = getMockSocketFrom(() => client.connect());

    client.disconnect();

    expect(socket.end).toHaveBeenCalled();
  });

  test('should not call socket.end() if socket is already destroyed', () => {
    const client = new TouchPortalClient(defaultConstructorOptions);
    const socket = getMockSocketFrom(() => client.connect());

    socket.destroyed = true;
    client.disconnect();

    expect(socket.end).not.toHaveBeenCalled();
  });

  test('should not throw if socket is null', () => {
    const client = new TouchPortalClient();

    expect(() => client.disconnect()).not.toThrow();
  });
});
