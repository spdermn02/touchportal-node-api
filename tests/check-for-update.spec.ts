import { describe, expect, Mock, test, vi } from 'vitest';
import { TouchPortalClientOptions } from '../src/types';
import TouchPortalClient from '../src/client';

vi.mock('require-from-app-root', () => ({
  requireFromAppRoot: () => {
    return { version: '1.0.0' };
  }
}));

global.fetch = vi.fn();

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
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => [version] } as Response);

    const listener = vi.fn();
    const client = new TouchPortalClient(defaultConstructorOptions);
    client.on('Update', listener);

    await client.checkForUpdate('user', 'repo');

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
      vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => [version] } as Response);

      const listener = vi.fn();
      const client = new TouchPortalClient(defaultConstructorOptions);
      client.on('Update', listener);

      await client.checkForUpdate('user', 'repo', true);

      if (shouldEmitUpdate) {
        expect(listener).toHaveBeenCalledWith(pluginVersion, version.tag_name.replace(/^v/, ''));
      } else {
        expect(listener).not.toHaveBeenCalled();
      }
    }
  );

  test('should log if fetch errors', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network fail'));

    const client = new TouchPortalClient(defaultConstructorOptions);
    await client.checkForUpdate('user', 'repo');

    expect(logCallback).toHaveBeenCalled();

    const [level, ...args] = logCallback.mock.calls[0];

    expect(typeof level).toBe('string');
    expect(args.length).toBeGreaterThan(0);
  });

  test('should log if response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);

    const client = new TouchPortalClient(defaultConstructorOptions);
    await client.checkForUpdate('user', 'repo');

    expect(logCallback).toHaveBeenCalled();

    const [level, ...args] = logCallback.mock.calls[0];

    expect(typeof level).toBe('string');
    expect(args.length).toBeGreaterThan(0);
  });
});
