/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import CRC32 from 'crc-32';
import { Tile, House, Huro, TILE_TYPES } from './common.js';
import * as Utils from './utils.js';
import { PlayerState } from './engine.player.js';

export type MasterState = {
	user1House: House;
	user2House: House;
	user3House: House;
	user4House: House;
	tiles: Tile[];

	/**
	 * 副露した牌を含まない手牌
	 */
	handTiles: {
		e: Tile[];
		s: Tile[];
		w: Tile[];
		n: Tile[];
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
			handTiles: {
				e: eHandTiles,
				s: sHandTiles,
				w: wHandTiles,
				n: nHandTiles,
			},
			hoTiles: {
				e: [],
				s: [],
				w: [],
				n: [],
			},
			huros: {
				e: [],
				s: [],
				w: [],
				n: [],
			},
			riichis: {
				e: false,
				s: false,
				w: false,
				n: false,
			},
			points: {
				e: 25000,
				s: 25000,
				w: 25000,
				n: 25000,
			},
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
		this.state.handTiles[this.state.turn].push(tile);
		return tile;
	}

	private canRon(house: House, tile: Tile): boolean {
		// フリテン
		// TODO: ポンされるなどして自分の河にない場合の考慮
		if (this.state.hoTiles[house].includes(tile)) return false;

		const horaSets = Utils.getHoraSets(this.state.handTiles[house].concat(tile));
		if (horaSets.length === 0) return false; // 完成形じゃない

		// TODO
		//const yakus = YAKU_DEFINITIONS.filter(yaku => yaku.calc(this.state, { tsumoTile: null, ronTile: tile }));
		//if (yakus.length === 0) return false; // 役がない

		return true;
	}

	private canPon(house: House, tile: Tile): boolean {
		return this.state.handTiles[house].filter(t => t === tile).length === 2;
	}

	public getHouse(index: 1 | 2 | 3 | 4): House {
		switch (index) {
			case 1: return this.state.user1House;
			case 2: return this.state.user2House;
			case 3: return this.state.user3House;
			case 4: return this.state.user4House;
		}
	}

	public commit_dahai(house: House, tile: Tile, riichi = false) {
		if (this.state.turn !== house) throw new Error('Not your turn');

		const handTiles = this.state.handTiles[house];
		if (!handTiles.includes(tile)) throw new Error('No such tile in your hand');
		handTiles.splice(handTiles.indexOf(tile), 1);
		this.state.hoTiles[house].push(tile);

		if (riichi) {
			this.state.riichis[house] = true;
		}

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

	public commit_resolveCallAndRonInterruption(answers: {
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

			const tile = this.state.hoTiles[source].pop()!;
			this.state.huros[target].push({ type: 'minkan', tile, from: source });

			clearAsking();
			this.state.turn = target;
			// TODO
			return;
		}

		if (this.state.ponAsking != null && answers.pon) {
			const source = this.state.ponAsking.source;
			const target = this.state.ponAsking.target;

			const tile = this.state.hoTiles[source].pop()!;
			this.state.handTiles[target].splice(this.state.handTiles[target].indexOf(tile), 1);
			this.state.handTiles[target].splice(this.state.handTiles[target].indexOf(tile), 1);
			this.state.huros[target].push({ type: 'pon', tile, from: source });

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

			const tile = this.state.hoTiles[source].pop()!;
			this.state.huros[target].push({ type: 'cii', tile, from: source });

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

	public createPlayerState(index: 1 | 2 | 3 | 4): PlayerState {
		const house = this.getHouse(index);

		return {
			user1House: this.state.user1House,
			user2House: this.state.user2House,
			user3House: this.state.user3House,
			user4House: this.state.user4House,
			tilesCount: this.state.tiles.length,
			handTiles: {
				e: house === 'e' ? this.state.handTiles.e : this.state.handTiles.e.map(() => null),
				s: house === 's' ? this.state.handTiles.s : this.state.handTiles.s.map(() => null),
				w: house === 'w' ? this.state.handTiles.w : this.state.handTiles.w.map(() => null),
				n: house === 'n' ? this.state.handTiles.n : this.state.handTiles.n.map(() => null),
			},
			hoTiles: {
				e: this.state.hoTiles.e,
				s: this.state.hoTiles.s,
				w: this.state.hoTiles.w,
				n: this.state.hoTiles.n,
			},
			huros: {
				e: this.state.huros.e,
				s: this.state.huros.s,
				w: this.state.huros.w,
				n: this.state.huros.n,
			},
			riichis: {
				e: this.state.riichis.e,
				s: this.state.riichis.s,
				w: this.state.riichis.w,
				n: this.state.riichis.n,
			},
			points: {
				e: this.state.points.e,
				s: this.state.points.s,
				w: this.state.points.w,
				n: this.state.points.n,
			},
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
