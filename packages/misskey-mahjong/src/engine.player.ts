/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import CRC32 from 'crc-32';
import { Tile, House, Huro, TILE_TYPES } from './common.js';
import * as Utils from './utils.js';

export type PlayerState = {
	user1House: House;
	user2House: House;
	user3House: House;
	user4House: House;
	tilesCount: number;

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

	public commit_tsumo(house: House, tile: Tile) {
		console.log('commit_tsumo', this.state.turn, house, tile);
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

	/**
	 * ロンします
	 * @param source 牌を捨てた人
	 * @param target ロンした人
	 */
	public commit_ron(source: House, target: House) {
		this.state.canRonSource = null;

		const lastTile = this.state.hoTiles[source].pop();
		if (lastTile == null) throw new PlayerGameEngine.InvalidOperationError();
		if (target === this.myHouse) {
			this.myHandTiles.push(lastTile);
		} else {
			this.state.handTiles[target].push(null);
		}
		this.state.turn = null;
	}

	/**
	 * ポンします
	 * @param source 牌を捨てた人
	 * @param target ポンした人
	 */
	public commit_pon(source: House, target: House) {
		this.state.canPonSource = null;

		const lastTile = this.state.hoTiles[source].pop();
		if (lastTile == null) throw new PlayerGameEngine.InvalidOperationError();
		if (target === this.myHouse) {
			this.myHandTiles.splice(this.myHandTiles.indexOf(lastTile), 1);
			this.myHandTiles.splice(this.myHandTiles.indexOf(lastTile), 1);
		} else {
			this.state.handTiles[target].unshift();
			this.state.handTiles[target].unshift();
		}
		this.state.huros[target].push({ type: 'pon', tile: lastTile, from: source });

		this.state.turn = target;
	}

	public commit_nop() {
		this.state.canRonSource = null;
		this.state.canPonSource = null;
	}
}
