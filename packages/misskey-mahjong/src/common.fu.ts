import { FourMentsuOneJyantou, mentsuEquals, TILE_NUMBER_MAP, TileType } from "./common.js";

/**
 * 4面子1雀頭の待ちに関わる部分
 */
export type WaitPattern = {
	agariTile: TileType;
} & ({
	completes: 'head';
} | {
	completes: 'mentsu';
	taatsu: [TileType, TileType];
});

export function calcWaitPatterns(fourMentsuOneJyantou: FourMentsuOneJyantou | null, agariTile: TileType): (WaitPattern | null)[] {
	if (fourMentsuOneJyantou == null) return [null];

	const result: WaitPattern[] = [];

	if (fourMentsuOneJyantou.head == agariTile) {
		result.push({
			completes: 'head',
			agariTile,
		});
	}

	const checkedMentsus: [TileType, TileType, TileType][] = [];
	for (const mentsu of fourMentsuOneJyantou.mentsus) {
		if (checkedMentsus.some(checkedMentsu => mentsuEquals(mentsu, checkedMentsu))) continue;
		const agariTileIndex = mentsu.indexOf(agariTile);
		if (agariTileIndex < 0) continue;
		result.push({
			completes: 'mentsu',
			agariTile,
			taatsu: mentsu.toSpliced(agariTileIndex, 1) as [TileType, TileType],
		})
		checkedMentsus.push(mentsu);
	}

	return result;
}

export function isRyanmen(taatsu: [TileType, TileType]): boolean {
	const number1 = TILE_NUMBER_MAP[taatsu[0]];
	const number2 = TILE_NUMBER_MAP[taatsu[1]];
	if (number1 == null || number2 == null) return false;
	return number1 + 1 == number2;
}

export function isToitsu(taatsu: [TileType, TileType]): boolean {
	return taatsu[0] == taatsu[1];
}
