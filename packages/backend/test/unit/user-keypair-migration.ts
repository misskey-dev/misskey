/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { generateKeyPairSync } from 'node:crypto';
import { describe, expect, test, vi } from 'vitest';
import { UserKeypairService } from '@/core/UserKeypairService.js';

const { privateKey } = generateKeyPairSync('rsa', {
	modulusLength: 1024,
	privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
	publicKeyEncoding: { type: 'spki', format: 'pem' },
});

describe('legacy RSA key conversion', () => {
	test('waits for persistence before returning the converted key', async () => {
		let release!: () => void;
		const pending = new Promise<void>(resolve => { release = resolve; });
		const update = vi.fn().mockReturnValue(pending);
		const service: UserKeypairService = Object.assign(Object.create(UserKeypairService.prototype), {
			userKeypairsRepository: { findOneByOrFail: async () => ({ privateKey }), update },
		});
		let finished = false;
		const result = service.fetcher('user').then(key => { finished = true; return key; });
		await vi.waitFor(() => expect(update).toHaveBeenCalled());
		expect(finished).toBe(false);
		release();
		expect((await result).privateKey).toContain('BEGIN PRIVATE KEY');
	});

	test('propagates a failed write instead of populating the cache', async () => {
		const error = new Error('write failed');
		const service: UserKeypairService = Object.assign(Object.create(UserKeypairService.prototype), {
			userKeypairsRepository: {
				findOneByOrFail: async () => ({ privateKey }),
				update: vi.fn().mockRejectedValue(error),
			},
		});
		await expect(service.fetcher('user')).rejects.toBe(error);
	});
});
