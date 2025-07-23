import {
  describe,
  expect,
  test,
  vi
} from 'vitest';
import TouchPortalClient from '../src/client';
import { TouchPortalClientOptions } from '../src/types';

describe('log', () => {
  test('should call logCallback when defined', async () => {
    const logCallback = vi.fn();
    const client = new TouchPortalClient({ logCallback });

    expect(() => client.connect()).toThrow();
    expect(logCallback).toHaveBeenCalled();

    const [level, ...args] = logCallback.mock.calls[0];

    expect(typeof level).toBe('string');
    expect(args.length).toBeGreaterThan(0);
  });

  test('should call console.log when logCallback is undefined', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const client = new TouchPortalClient();

    expect(() => client.connect()).toThrow();
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  test('should not call console.log if logCallback is null', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const client = new TouchPortalClient({ logCallback: null });

    expect(() => client.connect()).toThrow();
    expect(logSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
  });

  test.each([
    { logCallback: '' },
    { logCallback: true },
    { logCallback: 1 },
    { logCallback: {} }
  ] as unknown as TouchPortalClientOptions[])('should not call console.log if logCallback is not a function', (options) => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const client = new TouchPortalClient(options);

    expect(() => client.connect()).toThrow();
    expect(logSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
  });
});
