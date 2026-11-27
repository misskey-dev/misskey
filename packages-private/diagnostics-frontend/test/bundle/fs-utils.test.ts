/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { promises as fs } from 'node:fs';
import { afterEach, expect, test, vi } from 'vitest';
import { fileExists } from '../../src/bundle/fs-utils';

function fsError(code: string) {
	return Object.assign(new Error(`fs error: ${code}`), { code }) as NodeJS.ErrnoException;
}

afterEach(() => {
	vi.restoreAllMocks();
});

test('fileExists returns false for ENOENT', async () => {
	vi.spyOn(fs, 'access').mockRejectedValueOnce(fsError('ENOENT'));

	await expect(fileExists('missing')).resolves.toBe(false);
});

test('fileExists rethrows errors other than ENOENT', async () => {
	const error = fsError('EACCES');
	vi.spyOn(fs, 'access').mockRejectedValueOnce(error);

	await expect(fileExists('restricted')).rejects.toBe(error);
});
