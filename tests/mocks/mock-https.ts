import { EventEmitter } from 'events';
import { Readable } from 'stream';
import { vi } from 'vitest';

class MockResponse extends Readable {
  public statusCode: number;
  public headers: Record<string, string> = {};
  public rawHeaders: string[] = [];
  public body: string;

  public setEncoding = vi.fn();

  constructor(body: string, statusCode: number) {
    super();
    this.statusCode = statusCode;
    this.body = body;
  }

  _read() {
    this.push(this.body);
    this.push(null);
  }

  emitError(err: unknown) {
    process.nextTick(() => this.emit('error', err));
  }
}

class MockRequest extends EventEmitter {
  public end = vi.fn();
  public abort = vi.fn();

  emitError(err: unknown) {
    process.nextTick(() => this.emit('error', err));
  }
}

type MockHttpConfig =
  | { type: 'response'; body: string; statusCode: number }
  | { type: 'request-error'; error: Error }
  | { type: 'response-error'; error: Error };

const mockHttpConfigs: MockHttpConfig[] = [];
const mockHttpGetFactory = vi.fn((_, __, callback) => {
  const config = mockHttpConfigs.shift();
  const req = new MockRequest();

  if (!config) {
    throw new Error('No mock config specified for https.get call');
  }

  if (config.type === 'request-error') {
    process.nextTick(() => req.emitError(config.error));
    return req;
  }

  const res = new MockResponse(
    config.type === 'response' ? config.body : '',
    config.type === 'response' && config.statusCode ? config.statusCode : 200
  );

  process.nextTick(() => {
    callback(res);

    if (config.type === 'response-error') {
      res.emitError(config.error);
    } else {
      res._read();
    }
  });

  return req;
});

vi.mock('https', () => ({
  get: mockHttpGetFactory,
  default: { get: mockHttpGetFactory }
}));

export const mockResponse = (body: string, statusCode: number) => {
  mockHttpConfigs.push({ type: 'response', body, statusCode });
};

export const mockRequestError = (error: Error) => {
  mockHttpConfigs.push({ type: 'request-error', error });
};

export const mockResponseError = (error: Error) => {
  mockHttpConfigs.push({ type: 'response-error', error });
};
