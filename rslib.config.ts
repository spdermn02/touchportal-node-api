import { defineConfig } from '@rslib/core';
import { version } from './package.json';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      syntax: ['node 18'],
      dts: true
    },
    {
      format: 'cjs',
      syntax: ['node 18']
    }
  ],
  source: {
    define: {
      TOUCHPORTAL_NODE_API_VERSION: JSON.stringify(version)
    }
  }
});
