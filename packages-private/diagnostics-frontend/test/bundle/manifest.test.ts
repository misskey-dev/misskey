/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { collectBundleReport } from '../../src/bundle/manifest';

let workDir: string;

beforeAll(async () => {
	workDir = await mkdtemp(join(tmpdir(), 'diagnostics-frontend-test-'));
});

afterAll(async () => {
	await rm(workDir, { recursive: true, force: true });
});

test('fails loudly when the built output is missing', async () => {
	await expect(collectBundleReport(join(workDir, 'nonexistent'))).rejects.toThrow();
});
