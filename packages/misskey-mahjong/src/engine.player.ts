/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import CRC32 from 'crc-32';
import { Tile, House, Huro, TILE_TYPES, YAKU_DEFINITIONS } from './common.js';
import * as Common from './common.js';
import * as Utils from './utils.js';

export type PlayerState = {
	user1House: House;
	user2House: House;
	user3House: House;
	user4House: House;

	round: 'e' | 's' | 'w' | 'n';
	kyoku: number;

	tilesCount: number;
	doraIndicateTiles: Tile[];

	/**
	 * 副露した牌を含まない手牌
	 */
	handTiles: {
		e: Tile[] | null[];
		s: Tile[] | null[];
		w: Tile[] | null[];
		n: Tile[] | null[];
	};

	hoTiles: {
		e: Tile[];
		s: Tile[];
		w: Tile[];
		n: Tile[];
	};
	huros: {
		e: Huro[];
		s: Huro[];
		w: Huro[];
		n: Huro[];
	};
	riichis: {
		e: boolean;
		s: boolean;
		w: boolean;
		n: boolean;
	};
	points: {
		e: number;
		s: number;
		w: number;
		n: number;
	};
	latestDahaiedTile: Tile | null;
	turn: House | null;
	canPonSource: House | null;
	canCiiSource: House | null;
	canKanSource: House | null;
	canRonSource: House | null;
	canCiiTo: House | null;
	canKanTo: House | null;
	canRonTo: House | null;
};

export class PlayerGameEngine {
	/**
	 * このエラーが発生したときはdesyncが疑われる
	 */
	public static InvalidOperationError = class extends Error {};

	private myUserNumber: 1 | 2 | 3 | 4;
	public state: PlayerState;

	constructor(myUserNumber: PlayerGameEngine['myUserNumber'], state: PlayerState) {
		this.myUserNumber = myUserNumber;
		this.state = state;
	}

	public get myHouse(): House {
		switch (this.myUserNumber) {
			case 1: return this.state.user1House;
			case 2: return this.state.user2House;
			case 3: return this.state.user3House;
			case 4: return this.state.user4House;
		}
	}

	public get myHandTiles(): Tile[] {
		return this.state.handTiles[this.myHouse] as Tile[];
	}

	public get isMeRiichi(): boolean {
		return this.state.riichis[this.myHouse];
	}

	public get doras(): Tile[] {
		return this.state.doraIndicateTiles.map(t => Utils.nextTileForDora(t));
	}

	public commit_tsumo(house: House, tile: Tile) {
		console.log('commit_tsumo', this.state.turn, house, tile);
		this.state.tilesCount--;
		this.state.turn = house;
		if (house === this.myHouse) {
			this.myHandTiles.push(tile);
		} else {
			this.state.handTiles[house].push(null);
		}
	}

	public commit_dahai(house: House, tile: Tile, riichi = false) {
		console.log('commit_dahai', this.state.turn, house, tile, riichi);
		if (this.state.turn !== house) throw new PlayerGameEngine.InvalidOperationError();

		if (riichi) {
			this.state.riichis[house] = true;
		}

		if (house === this.myHouse) {
			this.myHandTiles.splice(this.myHandTiles.indexOf(tile), 1);
			this.state.hoTiles[this.myHouse].push(tile);
		} else {
			this.state.handTiles[house].pop();
			this.state.hoTiles[house].push(tile);
		}

		this.state.turn = null;

		if (house === this.myHouse) {
		} else {
			const canRon = Utils.getHoraSets(this.myHandTiles.concat(tile)).length > 0;
			const canPon = this.myHandTiles.filter(t => t === tile).length === 2;

			// TODO: canCii

			if (canRon) this.state.canRonSource = house;
			if (canPon) this.state.canPonSource = house;
		}
	}

	public commit_kakan(house: House, tile: Tile) {
		console.log('commit_kakan', this.state.turn, house, tile);
		if (this.state.turn !== house) throw new PlayerGameEngine.InvalidOperationError();
	}

	public commit_tsumoHora(house: House) {
		console.log('commit_tsumoHora', this.state.turn, house);

	// TODO: ツモした人の手牌情報を貰う必要がある
	}

	/**
	 * ロンします
	 * @param callers ロンした人
	 * @param callee 牌を捨てた人
	 */
	public commit_ronHora(callers: House[], callee: House, handTiles: {
		e: Tile[];
		s: Tile[];
		w: Tile[];
		n: Tile[];
	}) {
		console.log('commit_ronHora', this.state.turn, callers, callee);

		this.state.canRonSource = null;

		const yakusMap: Record<House, { name: string; fan: number; }[]> = {
			e: [] as { name: string; fan: number; }[],
			s: [] as { name: string; fan: number; }[],
			w: [] as { name: string; fan: number; }[],
			n: [] as { name: string; fan: number; }[],
		};

		const doraCountsMap: Record<House, number> = {
			e: 0,
			s: 0,
			w: 0,
			n: 0,
		};

		for (const house of callers) {
			const yakus = YAKU_DEFINITIONS.filter(yaku => yaku.calc({
				house: house,
				handTiles: handTiles[house],
				huros: this.state.huros[house],
				tsumoTile: null,
				ronTile: this.state.hoTiles[callee].at(-1)!,
				riichi: this.state.riichis[house],
			}));
			const doraCount = Common.calcOwnedDoraCount(handTiles[house], this.state.huros[house], this.doras);
			const fans = yakus.map(yaku => yaku.fan).reduce((a, b) => a + b, 0) + doraCount;
			const point = Common.fanToPoint(fans, house === 'e');
			this.state.points[callee] -= point;
			this.state.points[house] += point;
			yakusMap[house] = yakus.map(yaku => ({ name: yaku.name, fan: yaku.fan }));
			doraCountsMap[house] = doraCount;
			console.log('yakus', house, yakus);
		}

		return {
			yakusMap,
			doraCountsMap,
		};
	}

	/**
	 * ポンします
	 * @param caller ポンした人
	 * @param callee 牌を捨てた人
	 */
	public commit_pon(caller: House, callee: House) {
		this.state.canPonSource = null;

		const lastTile = this.state.hoTiles[callee].pop();
		if (lastTile == null) throw new PlayerGameEngine.InvalidOperationError();
		if (caller === this.myHouse) {
			this.myHandTiles.splice(this.myHandTiles.indexOf(lastTile), 1);
			this.myHandTiles.splice(this.myHandTiles.indexOf(lastTile), 1);
		} else {
			this.state.handTiles[caller].unshift();
			this.state.handTiles[caller].unshift();
		}
		this.state.huros[caller].push({ type: 'pon', tile: lastTile, from: callee });

		this.state.turn = caller;
	}

	public commit_nop() {
		this.state.canRonSource = null;
		this.state.canPonSource = null;
	}

	public get isMenzen(): boolean {
		const calls = ['pon', 'cii', 'minkan'];
		return this.state.huros[this.myHouse].filter(h => calls.includes(h.type)).length === 0;
	}

	public canRiichi(): boolean {
		if (this.state.turn !== this.myHouse) return false;
		if (this.state.riichis[this.myHouse]) return false;
		if (this.state.points[this.myHouse] < 1000) return false;
		if (!this.isMenzen) return false;
		if (Utils.getTilesForRiichi(this.myHandTiles).length === 0) return false;
		return true;
	}
}
