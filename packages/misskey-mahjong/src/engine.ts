/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import CRC32 from 'crc-32';
import { Tile, House, TILE_TYPES } from './common.js';
import * as Utils from './utils.js';

type Huro = {
	type: 'pon';
	tile: Tile;
	from: House;
} | {
	type: 'cii';
	tiles: [Tile, Tile, Tile];
	from: House;
} | {
	type: 'kan';
	tile: Tile;
	from: House;
} | {
	type: 'kakan';
	tile: Tile;
	from: House;
} | {
	type: 'ankan';
	tile: Tile;
	from: House;
};

export type MasterState = {
	user1House: House;
	user2House: House;
	user3House: House;
	user4House: House;
	tiles: Tile[];
	eHandTiles: Tile[];
	sHandTiles: Tile[];
	wHandTiles: Tile[];
	nHandTiles: Tile[];
	eHoTiles: Tile[];
	sHoTiles: Tile[];
	wHoTiles: Tile[];
	nHoTiles: Tile[];
	eHuros: Huro[];
	sHuros: Huro[];
	wHuros: Huro[];
	nHuros: Huro[];
	eRiichi: boolean;
	sRiichi: boolean;
	wRiichi: boolean;
	nRiichi: boolean;
	ePoints: number;
	sPoints: number;
	wPoints: number;
	nPoints: number;
	turn: House | null;
	nextTurnAfterAsking: House | null;

	ronAsking: {
		/**
		 * 牌を捨てた人
		 */
		source: House;

		/**
		 * ロンする権利がある人
		 */
		targets: House[];
	} | null;

	ponAsking: {
		/**
		 * 牌を捨てた人
		 */
		source: House;

		/**
		 * ポンする権利がある人
		 */
		target: House;
	} | null;

	ciiAsking: {
		/**
		 * 牌を捨てた人
		 */
		source: House;

		/**
		 * チーする権利がある人(sourceの下家なのは自明だがプログラム簡略化のため)
		 */
		target: House;
	} | null;

	kanAsking: {
		/**
		 * 牌を捨てた人
		 */
		source: House;

		/**
		 * カンする権利がある人
		 */
		target: House;
	} | null;
};

export class MasterGameEngine {
	public state: MasterState;

	constructor(state: MasterState) {
		this.state = state;
	}

	public static createInitialState(): MasterState {
		const tiles = [...TILE_TYPES.slice(), ...TILE_TYPES.slice(), ...TILE_TYPES.slice(), ...TILE_TYPES.slice()];
		tiles.sort(() => Math.random() - 0.5);

		const eHandTiles = tiles.splice(0, 14);
		const sHandTiles = tiles.splice(0, 13);
		const wHandTiles = tiles.splice(0, 13);
		const nHandTiles = tiles.splice(0, 13);

		return {
			user1House: 'e',
			user2House: 's',
			user3House: 'w',
			user4House: 'n',
			tiles,
			eHandTiles,
			sHandTiles,
			wHandTiles,
			nHandTiles,
			eHoTiles: [],
			sHoTiles: [],
			wHoTiles: [],
			nHoTiles: [],
			eHuros: [],
			sHuros: [],
			wHuros: [],
			nHuros: [],
			eRiichi: false,
			sRiichi: false,
			wRiichi: false,
			nRiichi: false,
			ePoints: 25000,
			sPoints: 25000,
			wPoints: 25000,
			nPoints: 25000,
			turn: 'e',
			nextTurnAfterAsking: null,
			ponAsking: null,
			ciiAsking: null,
			kanAsking: null,
			ronAsking: null,
		};
	}

	private tsumo(): Tile {
		const tile = this.state.tiles.pop();
		if (tile == null) throw new Error('No tiles left');
		if (this.state.turn == null) throw new Error('Not your turn');
		this.getHandTilesOf(this.state.turn).push(tile);
		return tile;
	}

	public op_dahai(house: House, tile: Tile) {
		if (this.state.turn !== house) throw new Error('Not your turn');

		const handTiles = this.getHandTilesOf(house);
		if (!handTiles.includes(tile)) throw new Error('No such tile in your hand');
		handTiles.splice(handTiles.indexOf(tile), 1);
		this.getHoTilesOf(house).push(tile);

		const canRonHouses: House[] = [];
		switch (house) {
			case 'e':
				if (this.canRon('s', tile)) canRonHouses.push('s');
				if (this.canRon('w', tile)) canRonHouses.push('w');
				if (this.canRon('n', tile)) canRonHouses.push('n');
				break;
			case 's':
				if (this.canRon('e', tile)) canRonHouses.push('e');
				if (this.canRon('w', tile)) canRonHouses.push('w');
				if (this.canRon('n', tile)) canRonHouses.push('n');
				break;
			case 'w':
				if (this.canRon('e', tile)) canRonHouses.push('e');
				if (this.canRon('s', tile)) canRonHouses.push('s');
				if (this.canRon('n', tile)) canRonHouses.push('n');
				break;
			case 'n':
				if (this.canRon('e', tile)) canRonHouses.push('e');
				if (this.canRon('s', tile)) canRonHouses.push('s');
				if (this.canRon('w', tile)) canRonHouses.push('w');
				break;
		}

		const canKanHouse: House | null = null;

		let canPonHouse: House | null = null;
		switch (house) {
			case 'e':
				canPonHouse = this.canPon('s', tile) ? 's' : this.canPon('w', tile) ? 'w' : this.canPon('n', tile) ? 'n' : null;
				break;
			case 's':
				canPonHouse = this.canPon('e', tile) ? 'e' : this.canPon('w', tile) ? 'w' : this.canPon('n', tile) ? 'n' : null;
				break;
			case 'w':
				canPonHouse = this.canPon('e', tile) ? 'e' : this.canPon('s', tile) ? 's' : this.canPon('n', tile) ? 'n' : null;
				break;
			case 'n':
				canPonHouse = this.canPon('e', tile) ? 'e' : this.canPon('s', tile) ? 's' : this.canPon('w', tile) ? 'w' : null;
				break;
		}

		const canCiiHouse: House | null = null;
		// TODO
		//let canCii: boolean = false;
		//if (house === 'e') {
		//	canCii = this.state.sHandTiles...
		//} else if (house === 's') {
		//	canCii = this.state.wHandTiles...
		//} else if (house === 'w') {
		//	canCii = this.state.nHandTiles...
		//} else if (house === 'n') {
		//	canCii = this.state.eHandTiles...
		//}

		if (canRonHouses.length > 0 || canPonHouse != null) {
			if (canRonHouses.length > 0) {
				this.state.ronAsking = {
					source: house,
					targets: canRonHouses,
				};
			}
			if (canKanHouse != null) {
				this.state.kanAsking = {
					source: house,
					target: canKanHouse,
				};
			}
			if (canPonHouse != null) {
				this.state.ponAsking = {
					source: house,
					target: canPonHouse,
				};
			}
			if (canCiiHouse != null) {
				this.state.ciiAsking = {
					source: house,
					target: canCiiHouse,
				};
			}
			this.state.turn = null;
			this.state.nextTurnAfterAsking = Utils.nextHouse(house);
			return {
				asking: true,
				canRonHouses: canRonHouses,
				canKanHouse: canKanHouse,
				canPonHouse: canPonHouse,
				canCiiHouse: canCiiHouse,
			};
		}

		this.state.turn = Utils.nextHouse(house);

		const tsumoTile = this.tsumo();

		return {
			asking: false,
			tsumoTile: tsumoTile,
		};
	}

	public op_resolveCallAndRonInterruption(answers: {
		pon: boolean;
		cii: boolean;
		kan: boolean;
		ron: House[];
	}) {
		if (this.state.ponAsking == null && this.state.ciiAsking == null && this.state.kanAsking == null && this.state.ronAsking == null) throw new Error();

		const clearAsking = () => {
			this.state.ponAsking = null;
			this.state.ciiAsking = null;
			this.state.kanAsking = null;
			this.state.ronAsking = null;
		};

		if (this.state.ronAsking != null && answers.ron.length > 0) {
			// TODO
			return;
		}

		if (this.state.kanAsking != null && answers.kan) {
			const source = this.state.kanAsking.source;
			const target = this.state.kanAsking.target;

			const tile = this.getHoTilesOf(source).pop()!;
			this.getHurosOf(target).push({ type: 'kan', tile, from: source });

			clearAsking();
			this.state.turn = target;
			// TODO
			return;
		}

		if (this.state.ponAsking != null && answers.pon) {
			const source = this.state.ponAsking.source;
			const target = this.state.ponAsking.target;

			const tile = this.getHoTilesOf(source).pop()!;
			this.getHandTilesOf(target).splice(this.getHandTilesOf(target).indexOf(tile), 1);
			this.getHandTilesOf(target).splice(this.getHandTilesOf(target).indexOf(tile), 1);
			this.getHurosOf(target).push({ type: 'pon', tile, from: source });

			clearAsking();
			this.state.turn = target;
			return {
				type: 'ponned',
				source,
				target,
				tile,
			};
		}

		if (this.state.ciiAsking != null && answers.cii) {
			const source = this.state.ciiAsking.source;
			const target = this.state.ciiAsking.target;

			const tile = this.getHoTilesOf(source).pop()!;
			this.getCiiedTilesOf(target).push({ tile, from: source });

			clearAsking();
			this.state.turn = target;
			return {
				type: 'ciied',
				source,
				target,
				tile,
			};
		}

		clearAsking();
		this.state.turn = this.state.nextTurnAfterAsking;
		this.state.nextTurnAfterAsking = null;

		const tile = this.tsumo();

		return {
			type: 'tsumo',
			house: this.state.turn,
			tile,
		};
	}

	private canRon(house: House, tile: Tile): boolean {
		// フリテン
		// TODO: ポンされるなどして自分の河にない場合の考慮
		if (this.getHoTilesOf(house).includes(tile)) return false;

		const horaSets = Utils.getHoraSets(this.getHandTilesOf(house).concat(tile));
		if (horaSets.length === 0) return false; // 完成形じゃない

		// TODO
		//const yakus = YAKU_DEFINITIONS.filter(yaku => yaku.calc(this.state, { tsumoTile: null, ronTile: tile }));
		//if (yakus.length === 0) return false; // 役がない

		return true;
	}

	private canPon(house: House, tile: Tile): boolean {
		return this.getHandTilesOf(house).filter(t => t === tile).length === 2;
	}

	public getHouse(index: 1 | 2 | 3 | 4): House {
		switch (index) {
			case 1: return this.state.user1House;
			case 2: return this.state.user2House;
			case 3: return this.state.user3House;
			case 4: return this.state.user4House;
		}
	}

	public getHandTilesOf(house: House): Tile[] {
		switch (house) {
			case 'e': return this.state.eHandTiles;
			case 's': return this.state.sHandTiles;
			case 'w': return this.state.wHandTiles;
			case 'n': return this.state.nHandTiles;
			default: throw new Error(`unrecognized house: ${house}`);
		}
	}

	public getHoTilesOf(house: House): Tile[] {
		switch (house) {
			case 'e': return this.state.eHoTiles;
			case 's': return this.state.sHoTiles;
			case 'w': return this.state.wHoTiles;
			case 'n': return this.state.nHoTiles;
			default: throw new Error(`unrecognized house: ${house}`);
		}
	}

	public getHurosOf(house: House): Huro[] {
		switch (house) {
			case 'e': return this.state.eHuros;
			case 's': return this.state.sHuros;
			case 'w': return this.state.wHuros;
			case 'n': return this.state.nHuros;
			default: throw new Error(`unrecognized house: ${house}`);
		}
	}

	public createPlayerState(index: 1 | 2 | 3 | 4): PlayerState {
		const house = this.getHouse(index);

		return {
			user1House: this.state.user1House,
			user2House: this.state.user2House,
			user3House: this.state.user3House,
			user4House: this.state.user4House,
			tilesCount: this.state.tiles.length,
			eHandTiles: house === 'e' ? this.state.eHandTiles : this.state.eHandTiles.map(() => null),
			sHandTiles: house === 's' ? this.state.sHandTiles : this.state.sHandTiles.map(() => null),
			wHandTiles: house === 'w' ? this.state.wHandTiles : this.state.wHandTiles.map(() => null),
			nHandTiles: house === 'n' ? this.state.nHandTiles : this.state.nHandTiles.map(() => null),
			eHoTiles: this.state.eHoTiles,
			sHoTiles: this.state.sHoTiles,
			wHoTiles: this.state.wHoTiles,
			nHoTiles: this.state.nHoTiles,
			eHuros: this.state.eHuros,
			sHuros: this.state.sHuros,
			wHuros: this.state.wHuros,
			nHuros: this.state.nHuros,
			eRiichi: this.state.eRiichi,
			sRiichi: this.state.sRiichi,
			wRiichi: this.state.wRiichi,
			nRiichi: this.state.nRiichi,
			ePoints: this.state.ePoints,
			sPoints: this.state.sPoints,
			wPoints: this.state.wPoints,
			nPoints: this.state.nPoints,
			latestDahaiedTile: null,
			turn: this.state.turn,
		};
	}

	public calcCrc32ForUser1(): number {
		// TODO
	}

	public calcCrc32ForUser2(): number {
		// TODO
	}

	public calcCrc32ForUser3(): number {
		// TODO
	}

	public calcCrc32ForUser4(): number {
		// TODO
	}
}

export type PlayerState = {
	user1House: House;
	user2House: House;
	user3House: House;
	user4House: House;
	tilesCount: number;
	eHandTiles: Tile[] | null[];
	sHandTiles: Tile[] | null[];
	wHandTiles: Tile[] | null[];
	nHandTiles: Tile[] | null[];
	eHoTiles: Tile[];
	sHoTiles: Tile[];
	wHoTiles: Tile[];
	nHoTiles: Tile[];
	eHuros: Huro[];
	sHuros: Huro[];
	wHuros: Huro[];
	nHuros: Huro[];
	eRiichi: boolean;
	sRiichi: boolean;
	wRiichi: boolean;
	nRiichi: boolean;
	ePoints: number;
	sPoints: number;
	wPoints: number;
	nPoints: number;
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
		switch (this.myHouse) {
			case 'e': return this.state.eHandTiles as Tile[];
			case 's': return this.state.sHandTiles as Tile[];
			case 'w': return this.state.wHandTiles as Tile[];
			case 'n': return this.state.nHandTiles as Tile[];
		}
	}

	public get myHoTiles(): Tile[] {
		switch (this.myHouse) {
			case 'e': return this.state.eHoTiles;
			case 's': return this.state.sHoTiles;
			case 'w': return this.state.wHoTiles;
			case 'n': return this.state.nHoTiles;
		}
	}

	public getHandTilesOf(house: House) {
		switch (house) {
			case 'e': return this.state.eHandTiles;
			case 's': return this.state.sHandTiles;
			case 'w': return this.state.wHandTiles;
			case 'n': return this.state.nHandTiles;
			default: throw new Error(`unrecognized house: ${house}`);
		}
	}

	public getHoTilesOf(house: House): Tile[] {
		switch (house) {
			case 'e': return this.state.eHoTiles;
			case 's': return this.state.sHoTiles;
			case 'w': return this.state.wHoTiles;
			case 'n': return this.state.nHoTiles;
			default: throw new Error(`unrecognized house: ${house}`);
		}
	}

	public getHurosOf(house: House): Huro[] {
		switch (house) {
			case 'e': return this.state.eHuros;
			case 's': return this.state.sHuros;
			case 'w': return this.state.wHuros;
			case 'n': return this.state.nHuros;
			default: throw new Error(`unrecognized house: ${house}`);
		}
	}

	public op_tsumo(house: House, tile: Tile) {
		console.log('op_tsumo', this.state.turn, house, tile);
		this.state.turn = house;
		if (house === this.myHouse) {
			this.myHandTiles.push(tile);
		} else {
			this.getHandTilesOf(house).push(null);
		}
	}

	public op_dahai(house: House, tile: Tile) {
		console.log('op_dahai', this.state.turn, house, tile);
		if (this.state.turn !== house) throw new PlayerGameEngine.InvalidOperationError();

		if (house === this.myHouse) {
			this.myHandTiles.splice(this.myHandTiles.indexOf(tile), 1);
			this.myHoTiles.push(tile);
		} else {
			this.getHandTilesOf(house).pop();
			this.getHoTilesOf(house).push(tile);
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
	public op_ron(source: House, target: House) {
		this.state.canRonSource = null;

		const lastTile = this.getHoTilesOf(source).pop();
		if (lastTile == null) throw new PlayerGameEngine.InvalidOperationError();
		if (target === this.myHouse) {
			this.myHandTiles.push(lastTile);
		} else {
			this.getHandTilesOf(target).push(null);
		}
		this.state.turn = null;
	}

	/**
	 * ポンします
	 * @param source 牌を捨てた人
	 * @param target ポンした人
	 */
	public op_pon(source: House, target: House) {
		this.state.canPonSource = null;

		const lastTile = this.getHoTilesOf(source).pop();
		if (lastTile == null) throw new PlayerGameEngine.InvalidOperationError();
		if (target === this.myHouse) {
			this.myHandTiles.splice(this.myHandTiles.indexOf(lastTile), 1);
			this.myHandTiles.splice(this.myHandTiles.indexOf(lastTile), 1);
		} else {
			this.getHandTilesOf(target).unshift();
			this.getHandTilesOf(target).unshift();
		}
		this.getHurosOf(target).push({ type: 'pon', tile: lastTile, from: source });

		this.state.turn = target;
	}

	public op_nop() {
		this.state.canRonSource = null;
		this.state.canPonSource = null;
	}
}

const YAKU_DEFINITIONS = [{
	name: 'riichi',
	fan: 1,
	calc: (state: PlayerState, ctx: { tsumoTile: Tile; ronTile: Tile; }) => {
		const house = state.turn;
		return house === 'e' ? state.eRiichi : house === 's' ? state.sRiichi : house === 'w' ? state.wRiichi : state.nRiichi;
	},
}];
