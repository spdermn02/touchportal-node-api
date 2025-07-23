import { vi } from 'vitest';
import { EventEmitter } from 'events';

class MockSocket extends EventEmitter {
  public destroyed = false;
  public write = vi.fn();
  public setEncoding = vi.fn();
  public connect = vi.fn((_, __, cb) => cb());
  public end = vi.fn(() => {
    this.destroyed = true;
  });
}

const mockSocketFactory = vi.fn(() => new MockSocket());

vi.mock('net', () => ({
  Socket: mockSocketFactory,
  default: { Socket: mockSocketFactory }
}));

export function getMockSocketFrom(cb: () => void): MockSocket {
  mockSocketFactory.mockClear();

  cb();

  const { results } = mockSocketFactory.mock;
  if (results.length === 0) {
    throw new Error('No mock socket instance was created during callback.');
  }

  return results[results.length - 1].value;
}
