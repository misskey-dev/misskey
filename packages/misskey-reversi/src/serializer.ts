/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Game } from './game.js';

export type Log = {
	time: number;
	player: boolean;
	operation: 'put';
	pos: number;
};

export type SerializedLog = number[];

export function serializeLogs(logs: Log[]) {
	const _logs: number[][] = [];

	for (let i = 0; i < logs.length; i++) {
		const log = logs[i];
		const timeDelta = i === 0 ? log.time : log.time - logs[i - 1].time;

		switch (log.operation) {
			case 'put':
				_logs.push([timeDelta, log.player ? 1 : 0, 0, log.pos]);
				break;
			//case 'surrender':
			//	_logs.push([timeDelta, log.player, 1]);
			//	break;
		}
	}

	return _logs;
}

export function deserializeLogs(logs: SerializedLog[]) {
	const _logs: Log[] = [];

	let time = 0;

	for (const log of logs) {
		const timeDelta = log[0];
		time += timeDelta;

		const player = log[1];
		const operation = log[2];

		switch (operation) {
			case 0:
				_logs.push({
					time,
					player: player === 1,
					operation: 'put',
					pos: log[3],
				});
				break;
			//case 1:
			//	_logs.push({
			//		time,
			//		player: player === 1,
			//		operation: 'surrender',
			//	});
			//	break;
		}
	}

	return _logs;
}

export function restoreGame(env: {
	map: string[];
	isLlotheo: boolean;
	canPutEverywhere: boolean;
	loopedBoard: boolean;
	logs: SerializedLog[];
}) {
	const logs = deserializeLogs(env.logs);

	const game = new Game(env.map, {
		isLlotheo: env.isLlotheo,
		canPutEverywhere: env.canPutEverywhere,
		loopedBoard: env.loopedBoard,
	});

	for (const log of logs) {
		switch (log.operation) {
			case 'put':
				game.putStone(log.pos);
				break;
			//case 'surrender':
			//	game.surrender(log.player);
			//	break;
		}
	}

	return game;
}
