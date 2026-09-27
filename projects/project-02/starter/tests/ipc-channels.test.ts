import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { IPC_CHANNELS } from '../src/shared/types';

describe('sandboxed preload channels', () => {
  it('inlines every IPC channel name from the shared constants', () => {
    const preload = fs.readFileSync(
      path.join(__dirname, '../src/preload/preload.ts'),
      'utf8',
    );

    for (const channel of Object.values(IPC_CHANNELS)) {
      expect(preload).toContain(`'${channel}'`);
    }
  });
});
