/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Tile } from './engine.js';

export type Log = {
	time: number;
	player: 1 | 2 | 3 | 4;
	operation: 'dahai';
	tile: string;
};

export type SerializedLog = number[];

export const TILE_MAP: Record<Tile, number> = {
	'bamboo1': 1,
	'bamboo2': 2,
	'bamboo3': 3,
	'bamboo4': 4,
	'bamboo5': 5,
	'bamboo6': 6,
	'bamboo7': 7,
	'bamboo8': 8,
	'bamboo9': 9,
	'character1': 10,
	'character2': 11,
	'character3': 12,
	'character4': 13,
	'character5': 14,
	'character6': 15,
	'character7': 16,
	'character8': 17,
	'character9': 18,
	'circle1': 19,
	'circle2': 20,
	'circle3': 21,
	'circle4': 22,
	'circle5': 23,
	'circle6': 24,
	'circle7': 25,
	'circle8': 26,
	'circle9': 27,
	'wind-east': 28,
	'wind-south': 29,
	'wind-west': 30,
	'wind-north': 31,
	'dragon-red': 32,
	'dragon-green': 33,
	'dragon-white': 34,
};

export function serializeTile(tile: Tile): number {
	return TILE_MAP[tile];
}

export function deserializeTile(tile: number): Tile {
	return Object.keys(TILE_MAP).find(key => TILE_MAP[key as Tile] === tile) as Tile;
}

export function serializeLogs(logs: Log[]) {
	const _logs: number[][] = [];

	for (let i = 0; i < logs.length; i++) {
		const log = logs[i];
		const timeDelta = i === 0 ? log.time : log.time - logs[i - 1].time;

		switch (log.operation) {
			case 'dahai':
				_logs.push([timeDelta, log.player, 1, serializeTile(log.tile)]);
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
			case 1:
				_logs.push({
					time,
					player: player,
					operation: 'dahai',
					tile: log[3],
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
