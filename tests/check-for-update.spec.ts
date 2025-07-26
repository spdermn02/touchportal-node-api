import { describe, expect, Mock, test, vi } from 'vitest';
import { mockResponse, mockResponseError, mockRequestError } from './mocks/mock-https';
import { TouchPortalClientOptions } from '../src/types';
import TouchPortalClient from '../src/client';
import { nextTick } from './utilities/next-tick';

describe('checkForUpdate', () => {
  const pluginVersion = '1.0.0';
  const pluginId: string = 'test.plugin';
  const logCallback: Mock = vi.fn();
  const defaultConstructorOptions: TouchPortalClientOptions = { pluginId, logCallback };

  test.each([
    { version: { tag_name: 'v1.3.0-beta', prerelease: true }, shouldEmitUpdate: false },
    { version: { tag_name: 'v1.2.0', prerelease: false }, shouldEmitUpdate: true },
    { version: { tag_name: 'v1.0.0', prerelease: false }, shouldEmitUpdate: false },
    { version: { tag_name: 'v0.1.0', prerelease: false }, shouldEmitUpdate: false }
  ])('should emit a "Update" event if a newer stable version is found', async ({ version, shouldEmitUpdate }) => {
    mockResponse(JSON.stringify([version]), 200);

    const listener = vi.fn();
    const client = new TouchPortalClient(defaultConstructorOptions);
    client.on('Update', listener);
    client.checkForUpdate('user', 'repo', pluginVersion);

    await nextTick();

    if (shouldEmitUpdate) {
      expect(listener).toHaveBeenCalledWith(pluginVersion, version.tag_name.replace(/^v/, ''));
    } else {
      expect(listener).not.toHaveBeenCalled();
    }
  });

  test.each([
    { version: { tag_name: 'v1.3.0-beta', prerelease: true }, shouldEmitUpdate: true },
    { version: { tag_name: 'v1.2.0-alpha', prerelease: true }, shouldEmitUpdate: true },
    { version: { tag_name: 'v1.1.0', prerelease: false }, shouldEmitUpdate: true },
    { version: { tag_name: 'v1.0.0', prerelease: false }, shouldEmitUpdate: false },
    { version: { tag_name: 'v0.1.0', prerelease: false }, shouldEmitUpdate: false }
  ])(
    'should emit a "Update" event if a newer stable or prerelease version is found',
    async ({ version, shouldEmitUpdate }) => {
      mockResponse(JSON.stringify([version]), 200);

      const listener = vi.fn();
      const client = new TouchPortalClient(defaultConstructorOptions);
      client.on('Update', listener);
      client.checkForUpdate('user', 'repo', pluginVersion, true);

      await nextTick();

      if (shouldEmitUpdate) {
        expect(listener).toHaveBeenCalledWith(pluginVersion, version.tag_name.replace(/^v/, ''));
      } else {
        expect(listener).not.toHaveBeenCalled();
      }
    }
  );

  test('should log if get request errors', async () => {
    mockRequestError(new Error('Network fail'));

    const client = new TouchPortalClient(defaultConstructorOptions);
    client.checkForUpdate('user', 'repo', pluginVersion);

    await nextTick();

    expect(logCallback).toHaveBeenCalled();

    const [level, ...args] = logCallback.mock.calls[0];

    expect(typeof level).toBe('string');
    expect(args.length).toBeGreaterThan(0);
  });

  test('should log if get response errors', async () => {
    mockResponseError(new Error('Response error'));

    const client = new TouchPortalClient(defaultConstructorOptions);
    client.checkForUpdate('user', 'repo', pluginVersion);

    await nextTick();

    expect(logCallback).toHaveBeenCalled();

    const [level, ...args] = logCallback.mock.calls[0];

    expect(typeof level).toBe('string');
    expect(args.length).toBeGreaterThan(0);
  });

  test('should log if response is not ok', async () => {
    mockResponse('', 404);

    const client = new TouchPortalClient(defaultConstructorOptions);
    client.checkForUpdate('user', 'repo', pluginVersion);

    await nextTick();

    expect(logCallback).toHaveBeenCalled();

    const [level, ...args] = logCallback.mock.calls[0];

    expect(typeof level).toBe('string');
    expect(args.length).toBeGreaterThan(0);
  });
});
