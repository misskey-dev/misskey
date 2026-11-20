/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { NotePiningService } from '@/core/NotePiningService.js';

describe('NotePiningService', () => {
	test('removePinned waits for the deletion to complete', async () => {
		let resolveDelete!: () => void;
		const deletePromise = new Promise<void>(resolve => {
			resolveDelete = resolve;
		});
		const userNotePiningsRepository = {
			delete: vi.fn(() => deletePromise),
		};
		const service = new NotePiningService(
			{} as never,
			{} as never,
			{
				findOneBy: vi.fn().mockResolvedValue({
					id: 'noteId',
					userId: 'userId',
					localOnly: false,
					visibility: 'private',
				}),
			} as never,
			userNotePiningsRepository as never,
			{ isLocalUser: () => false } as never,
			{} as never,
			{} as never,
			{} as never,
			{} as never,
			{} as never,
		);

		let resolved = false;
		const promise = service.removePinned({ id: 'userId', host: null }, 'noteId').then(() => {
			resolved = true;
		});

		await new Promise(resolve => setImmediate(resolve));
		expect(resolved).toBe(false);

		resolveDelete();
		await promise;
		expect(resolved).toBe(true);
	});
});
