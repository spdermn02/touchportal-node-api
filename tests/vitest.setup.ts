import { vi } from 'vitest';

vi.stubGlobal('fetch', vi.fn());
vi.stubGlobal('TOUCHPORTAL_NODE_API_VERSION', '1.0.0');
