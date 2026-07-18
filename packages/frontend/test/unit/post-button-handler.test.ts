/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { PathResolvedResult, RouteDef } from '@/lib/nirax.js';
import { postButtonHandler } from '@/utility/post-button-handler.js';

const postMock = vi.hoisted(() => vi.fn());

vi.mock('@/os.js', () => ({
	post: postMock
}));

const misskeyApiMock = vi.hoisted(() => vi.fn());

vi.mock('@/utility/misskey-api.js', () => ({
	misskeyApi: misskeyApiMock
}));

const getItemMock = vi.hoisted(() => vi.fn());
const removeItemMock = vi.hoisted(() => vi.fn());

vi.mock('@/local-storage.js', () => ({
	miLocalStorage: {
		getItem: getItemMock,
		removeItem: removeItemMock,
	},
}));

describe('postButtonHandler', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	const indexPage: Partial<PathResolvedResult> = {
		route: {
			name: 'index',
		} as RouteDef,
		props: new Map(),
	};
	const channelPage: Partial<PathResolvedResult> = {
		route: {
			name: 'channel',
		} as RouteDef,
		props: new Map([
			['channelId', 'abc123'],
		]),
	};

	test('通常ページでは通常TL向けの投稿フォームが開かれる', async () => {
		await postButtonHandler(indexPage as PathResolvedResult);

		expect(getItemMock).not.toHaveBeenCalled();
		expect(misskeyApiMock).not.toHaveBeenCalled();
		expect(postMock).toHaveBeenCalledWith();
	});

	test('キャッシュがある場合、チャンネルページではキャッシュを利用してチャンネル向けの投稿フォームが開かれる', async () => {
		const cachedChannelData = {
			id: 'abc123',
			name: 'ABC123-Channel-Cached'
		};

		getItemMock.mockReturnValue(JSON.stringify(cachedChannelData));

		await postButtonHandler(channelPage as PathResolvedResult);

		expect(getItemMock).toHaveBeenCalledWith('channel:abc123');
		expect(misskeyApiMock).not.toHaveBeenCalled();
		expect(postMock).toHaveBeenCalledWith({ channel: cachedChannelData });
	});

	test('キャッシュがない場合、チャンネルページではMisskeyAPIを利用してチャンネル向けの投稿フォームが開かれる', async () => {
		const apiChannelData = {
			id: 'abc123',
			name: 'ABC123-Channel-API'
		};

		misskeyApiMock.mockResolvedValue(apiChannelData);

		await postButtonHandler(channelPage as PathResolvedResult);

		expect(getItemMock).toHaveBeenCalledWith('channel:abc123');
		expect(misskeyApiMock).toHaveBeenCalledWith(
			'channels/show',
			{
				channelId: 'abc123',
			},
		);
		expect(postMock).toHaveBeenCalledWith({ channel: apiChannelData });
	});
});
