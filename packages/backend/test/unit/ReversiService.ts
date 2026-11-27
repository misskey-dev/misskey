/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { maps } from 'misskey-reversi';
import { expect, test } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { ReversiService } from '@/core/ReversiService.js';
import type { GlobalEventService } from '@/core/GlobalEventService.js';
import type { MiUser } from '@/models/User.js';
import type { Redis } from 'ioredis';

test('a game fetched when a move is published includes that move', async () => {
	const player = mock<MiUser>({ id: 'black' });
	const gameId = 'game';
	const cacheKey = `reversi:game:cache:${gameId}`;
	let cachedGame = JSON.stringify({
		id: gameId, user1Id: player.id, user2Id: 'white', black: 1,
		isStarted: true, isEnded: false, map: maps.fourfour.data, logs: [],
		isLlotheo: false, canPutEverywhere: false, loopedBoard: false, timeLimitForEachTurn: 90,
	});
	const writeStarted = Promise.withResolvers<void>();
	const finishWrite = Promise.withResolvers<void>();
	const redis = mock<Redis>();
	redis.get.calledWith(cacheKey).mockImplementation(async () => cachedGame);
	redis.setex.mockImplementation(async (key, _ttl, value) => {
		if (key === cacheKey) {
			writeStarted.resolve();
			await finishWrite.promise;
			cachedGame = value.toString();
		}
		return 'OK' as const;
	});

	const events = mock<GlobalEventService>();
	const service = new ReversiService(mock(), redis, mock(), mock(), mock(), events, mock(), mock());
	let gameAtLog: ReturnType<typeof service.get> | undefined;
	events.publishReversiGameStream.mockImplementation((id, type) => {
		if (type === 'log') gameAtLog = service.get(id);
	});

	const pos = 1;
	const move = service.putStoneToGame(gameId, player, pos);
	await writeStarted.promise;
	finishWrite.resolve();
	await move;
	await expect(gameAtLog).resolves.toMatchObject({ logs: [[expect.any(Number), 1, 0, pos]] });
});
