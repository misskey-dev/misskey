/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { ClipService } from '@/core/ClipService.js';
import { ClipChannel } from '@/server/api/stream/channels/clip.js';

describe('ClipService', () => {
	let clipsRepository: {
		findOneBy: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
	};
	let globalEventService: {
		publishClipStream: ReturnType<typeof vi.fn>;
	};
	let clipService: ClipService;

	beforeEach(() => {
		vi.useFakeTimers();

		clipsRepository = {
			findOneBy: vi.fn().mockResolvedValue({
				id: 'clip-1',
				userId: 'user-1',
			}),
			update: vi.fn().mockResolvedValue(undefined),
		};
		globalEventService = {
			publishClipStream: vi.fn(),
		};

		clipService = new ClipService(
			clipsRepository as any,
			{} as any,
			{} as any,
			{} as any,
			{} as any,
			globalEventService as any,
		);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	test('debounces trailing update publish until updates have been quiet for the throttle window', async () => {
		await clipService.update({ id: 'user-1' } as any, 'clip-1', 'name-1', undefined, undefined);

		expect(globalEventService.publishClipStream).toHaveBeenCalledTimes(1);
		expect(globalEventService.publishClipStream).toHaveBeenLastCalledWith('clip-1', 'updated');

		vi.advanceTimersByTime(1000);
		await clipService.update({ id: 'user-1' } as any, 'clip-1', 'name-2', undefined, undefined);

		vi.advanceTimersByTime(2999);
		expect(globalEventService.publishClipStream).toHaveBeenCalledTimes(1);

		vi.advanceTimersByTime(1);
		expect(globalEventService.publishClipStream).toHaveBeenCalledTimes(2);
		expect(globalEventService.publishClipStream).toHaveBeenLastCalledWith('clip-1', 'updated');
	});
});

describe('ClipChannel', () => {
	test('does not forward internal clip stream payload body to websocket subscribers', async () => {
		const subscriber = new EventEmitter();
		const sendMessageToWs = vi.fn();
		const channel = new ClipChannel(
			{
				findOneBy: vi.fn().mockResolvedValue({
					id: 'clip-1',
					userId: 'owner-1',
					isPublic: true,
				}),
			} as any,
			{
				id: 'channel-1',
				connection: {
					user: { id: 'viewer-1' },
					subscriber,
					sendMessageToWs,
				},
			} as any,
		);

		await channel.init({ clipId: 'clip-1' });

		subscriber.emit('clipStream:clip-1', {
			type: 'updated',
			body: { shouldNotLeak: true },
		});

		expect(sendMessageToWs).toHaveBeenCalledWith('channel', {
			id: 'channel-1',
			type: 'updated',
			body: null,
		});
	});
});
