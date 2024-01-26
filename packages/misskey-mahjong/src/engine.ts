/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import CRC32 from 'crc-32';

export const TILE_TYPES = [
	'bamboo1',
	'bamboo2',
	'bamboo3',
	'bamboo4',
	'bamboo5',
	'bamboo6',
	'bamboo7',
	'bamboo8',
	'bamboo9',
	'character1',
	'character2',
	'character3',
	'character4',
	'character5',
	'character6',
	'character7',
	'character8',
	'character9',
	'circle1',
	'circle2',
	'circle3',
	'circle4',
	'circle5',
	'circle6',
	'circle7',
	'circle8',
	'circle9',
	'wind-east',
	'wind-south',
	'wind-west',
	'wind-north',
	'dragon-red',
	'dragon-green',
	'dragon-white',
] as const;

export type Tile = typeof TILE_TYPES[number];

export function isTile(tile: string): tile is Tile {
	return TILE_TYPES.includes(tile as Tile);
}

export type House = 'e' | 's' | 'w' | 'n';

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
	ePonnedTiles: { tile: Tile; from: House; }[];
	sPonnedTiles: { tile: Tile; from: House; }[];
	wPonnedTiles: { tile: Tile; from: House; }[];
	nPonnedTiles: { tile: Tile; from: House; }[];
	eCiiedTiles: { tiles: [Tile, Tile, Tile]; from: House; }[];
	sCiiedTiles: { tiles: [Tile, Tile, Tile]; from: House; }[];
	wCiiedTiles: { tiles: [Tile, Tile, Tile]; from: House; }[];
	nCiiedTiles: { tiles: [Tile, Tile, Tile]; from: House; }[];
	eRiichi: boolean;
	sRiichi: boolean;
	wRiichi: boolean;
	nRiichi: boolean;
	ePoints: number;
	sPoints: number;
	wPoints: number;
	nPoints: number;
	turn: House | null;
	ponAsking: {
		source: House;
		target: House;
	} | null;
	ciiAsking: {
		source: House;
	} | null;
};

export class Common {
	public static nextHouse(house: House): House {
		switch (house) {
			case 'e':
				return 's';
			case 's':
				return 'w';
			case 'w':
				return 'n';
			case 'n':
				return 'e';
		}
	}

	public static checkYaku(tiles: Tile[]) {

	}
}

export class MasterGameEngine {
	public state: MasterState;

	constructor(state: MasterState) {
		this.state = state;
	}

	public static createInitialState(): MasterState {
		const tiles = TILE_TYPES.slice();
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
			ePonnedTiles: [],
			sPonnedTiles: [],
			wPonnedTiles: [],
			nPonnedTiles: [],
			eCiiedTiles: [],
			sCiiedTiles: [],
			wCiiedTiles: [],
			nCiiedTiles: [],
			eRiichi: false,
			sRiichi: false,
			wRiichi: false,
			nRiichi: false,
			ePoints: 25000,
			sPoints: 25000,
			wPoints: 25000,
			nPoints: 25000,
			turn: 'e',
			ponAsking: null,
			ciiAsking: null,
		};
	}

	private ツモ(): Tile {
		const tile = this.state.tiles.pop();
		switch (this.state.turn) {
			case 'e':
				this.state.eHandTiles.push(tile);
				break;
			case 's':
				this.state.sHandTiles.push(tile);
				break;
			case 'w':
				this.state.wHandTiles.push(tile);
				break;
			case 'n':
				this.state.nHandTiles.push(tile);
				break;
		}
		return tile;
	}

	public op_dahai(house: House, tile: Tile) {
		if (this.state.turn !== house) throw new Error('Not your turn');

		switch (house) {
			case 'e':
				if (!this.state.eHandTiles.includes(tile)) throw new Error('Invalid tile');
				this.state.eHandTiles.splice(this.state.eHandTiles.indexOf(tile), 1);
				this.state.eHoTiles.push(tile);
				break;
			case 's':
				if (!this.state.sHandTiles.includes(tile)) throw new Error('Invalid tile');
				this.state.sHandTiles.splice(this.state.sHandTiles.indexOf(tile), 1);
				this.state.sHoTiles.push(tile);
				break;
			case 'w':
				if (!this.state.wHandTiles.includes(tile)) throw new Error('Invalid tile');
				this.state.wHandTiles.splice(this.state.wHandTiles.indexOf(tile), 1);
				this.state.wHoTiles.push(tile);
				break;
			case 'n':
				if (!this.state.nHandTiles.includes(tile)) throw new Error('Invalid tile');
				this.state.nHandTiles.splice(this.state.nHandTiles.indexOf(tile), 1);
				this.state.nHoTiles.push(tile);
				break;
		}

		let canPonHouse: House | null = null;
		if (house === 'e') {
			canPonHouse = this.canPon('s', tile) ? 's' : this.canPon('w', tile) ? 'w' : this.canPon('n', tile) ? 'n' : null;
		} else if (house === 's') {
			canPonHouse = this.canPon('e', tile) ? 'e' : this.canPon('w', tile) ? 'w' : this.canPon('n', tile) ? 'n' : null;
		} else if (house === 'w') {
			canPonHouse = this.canPon('e', tile) ? 'e' : this.canPon('s', tile) ? 's' : this.canPon('n', tile) ? 'n' : null;
		} else if (house === 'n') {
			canPonHouse = this.canPon('e', tile) ? 'e' : this.canPon('s', tile) ? 's' : this.canPon('w', tile) ? 'w' : null;
		}

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

		if (canPonHouse) {
			this.state.ponAsking = {
				source: house,
				target: canPonHouse,
			};
			return {
				canPonHouse: canPonHouse,
			};
		}

		this.state.turn = Common.nextHouse(house);

		const tsumoTile = this.ツモ();

		return {
			tsumo: tsumoTile,
		};
	}

	public op_pon(house: House) {
		if (this.state.ponAsking == null) throw new Error('No one is asking for pon');
		if (this.state.ponAsking.target !== house) throw new Error('Not you');

		const source = this.state.ponAsking.source;
		const target = this.state.ponAsking.target;
		this.state.ponAsking = null;

		let tile: Tile;

		switch (source) {
			case 'e':
				tile = this.state.eHoTiles.pop();
				break;
			case 's':
				tile = this.state.sHoTiles.pop();
				break;
			case 'w':
				tile = this.state.wHoTiles.pop();
				break;
			case 'n':
				tile = this.state.nHoTiles.pop();
				break;
			default: throw new Error('Invalid source');
		}

		switch (target) {
			case 'e':
				this.state.ePonnedTiles.push({ tile, from: source });
				break;
			case 's':
				this.state.sPonnedTiles.push({ tile, from: source });
				break;
			case 'w':
				this.state.wPonnedTiles.push({ tile, from: source });
				break;
			case 'n':
				this.state.nPonnedTiles.push({ tile, from: source });
				break;
		}

		this.state.turn = target;
	}

	public op_noOnePon() {
		if (this.state.ponAsking == null) throw new Error('No one is asking for pon');

		this.state.ponAsking = null;
		this.state.turn = Common.nextHouse(this.state.turn);

		const tile = this.ツモ();

		return {
			house: this.state.turn,
			tile,
		};
	}

	private canPon(house: House, tile: Tile): boolean {
		switch (house) {
			case 'e':
				return this.state.eHandTiles.filter(t => t === tile).length === 2;
			case 's':
				return this.state.sHandTiles.filter(t => t === tile).length === 2;
			case 'w':
				return this.state.wHandTiles.filter(t => t === tile).length === 2;
			case 'n':
				return this.state.nHandTiles.filter(t => t === tile).length === 2;
		}
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
	ePonnedTiles: { tile: Tile; from: House; }[];
	sPonnedTiles: { tile: Tile; from: House; }[];
	wPonnedTiles: { tile: Tile; from: House; }[];
	nPonnedTiles: { tile: Tile; from: House; }[];
	eCiiedTiles: { tiles: [Tile, Tile, Tile]; from: House; }[];
	sCiiedTiles: { tiles: [Tile, Tile, Tile]; from: House; }[];
	wCiiedTiles: { tiles: [Tile, Tile, Tile]; from: House; }[];
	nCiiedTiles: { tiles: [Tile, Tile, Tile]; from: House; }[];
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

	public op_tsumo(house: House, tile: Tile) {
		if (house === this.myHouse) {
			this.myHandTiles.push(tile);
		} else {
			switch (house) {
				case 'e':
					this.state.eHandTiles.push(null);
					break;
				case 's':
					this.state.sHandTiles.push(null);
					break;
				case 'w':
					this.state.wHandTiles.push(null);
					break;
				case 'n':
					this.state.nHandTiles.push(null);
					break;
			}
		}
	}

	public op_dahai(house: House, tile: Tile) {
		if (this.state.turn !== house) throw new PlayerGameEngine.InvalidOperationError();

		if (house === this.myHouse) {
			this.myHandTiles.splice(this.myHandTiles.indexOf(tile), 1);
			this.myHoTiles.push(tile);
		} else {
			switch (house) {
				case 'e':
					this.state.eHandTiles.pop();
					this.state.eHoTiles.push(tile);
					break;
				case 's':
					this.state.sHandTiles.pop();
					this.state.sHoTiles.push(tile);
					break;
				case 'w':
					this.state.wHandTiles.pop();
					this.state.wHoTiles.push(tile);
					break;
				case 'n':
					this.state.nHandTiles.pop();
					this.state.nHoTiles.push(tile);
					break;
			}
		}

		if (house === this.myHouse) {
			this.state.turn = null;
		} else {
			const canPon = this.myHandTiles.filter(t => t === tile).length === 2;

			// TODO: canCii

			return {
				canPon,
			};
		}
	}

	public op_pon(source: House, target: House) {
		let tile: Tile;

		switch (source) {
			case 'e': {
				const lastTile = this.state.eHoTiles.pop();
				if (lastTile == null) throw new PlayerGameEngine.InvalidOperationError();
				tile = lastTile;
				break;
			}
			case 's': {
				const lastTile = this.state.sHoTiles.pop();
				if (lastTile == null) throw new PlayerGameEngine.InvalidOperationError();
				tile = lastTile;
				break;
			}
			case 'w': {
				const lastTile = this.state.wHoTiles.pop();
				if (lastTile == null) throw new PlayerGameEngine.InvalidOperationError();
				tile = lastTile;
				break;
			}
			case 'n': {
				const lastTile = this.state.nHoTiles.pop();
				if (lastTile == null) throw new PlayerGameEngine.InvalidOperationError();
				tile = lastTile;
				break;
			}
			default: throw new Error('Invalid source');
		}

		switch (target) {
			case 'e':
				this.state.ePonnedTiles.push({ tile, from: source });
				break;
			case 's':
				this.state.sPonnedTiles.push({ tile, from: source });
				break;
			case 'w':
				this.state.wPonnedTiles.push({ tile, from: source });
				break;
			case 'n':
				this.state.nPonnedTiles.push({ tile, from: source });
				break;
		}

		this.state.turn = target;
	}
}
