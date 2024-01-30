/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import CRC32 from 'crc-32';
import { Tile, House, Huro, TILE_TYPES, YAKU_DEFINITIONS } from './common.js';
import * as Utils from './utils.js';
import { PlayerState } from './engine.player.js';

export type MasterState = {
	user1House: House;
	user2House: House;
	user3House: House;
	user4House: House;

	round: 'e' | 's' | 'w' | 'n';
	kyoku: number;

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
		callee: House;

		/**
		 * ロンする権利がある人
		 */
		callers: House[];
	} | null;

	ponAsking: {
		/**
		 * 牌を捨てた人
		 */
		callee: House;

		/**
		 * ポンする権利がある人
		 */
		caller: House;
	} | null;

	ciiAsking: {
		/**
		 * 牌を捨てた人
		 */
		callee: House;

		/**
		 * チーする権利がある人(calleeの下家なのは自明だがプログラム簡略化のため)
		 */
		caller: House;
	} | null;

	kanAsking: {
		/**
		 * 牌を捨てた人
		 */
		callee: House;

		/**
		 * カンする権利がある人
		 */
		caller: House;
	} | null;
};

export class MasterGameEngine {
	public state: MasterState;

	constructor(state: MasterState) {
		this.state = state;
	}

	public static createInitialState(): MasterState {
		const ikasama: Tile[] = ['haku', 'm2', 'm3', 'p5', 'p6', 'p7', 's2', 's3', 's4', 'chun', 'chun', 'chun', 'n', 'n'];

		const tiles = [...TILE_TYPES.slice(), ...TILE_TYPES.slice(), ...TILE_TYPES.slice(), ...TILE_TYPES.slice()];
		tiles.sort(() => Math.random() - 0.5);

		for (const tile of ikasama) {
			const index = tiles.indexOf(tile);
			tiles.splice(index, 1);
		}

		//const eHandTiles = tiles.splice(0, 14);
		const eHandTiles = ikasama;
		const sHandTiles = tiles.splice(0, 13);
		const wHandTiles = tiles.splice(0, 13);
		const nHandTiles = tiles.splice(0, 13);

		return {
			user1House: 'e',
			user2House: 's',
			user3House: 'w',
			user4House: 'n',
			round: 'e',
			kyoku: 1,
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

	private endKyoku() {
		console.log('endKyoku');
		const newState = MasterGameEngine.createInitialState();
		newState.kyoku = this.state.kyoku + 1;
		newState.points = this.state.points;
	}

	private ron(callers: House[], callee: House) {
		for (const house of callers) {
			const yakus = YAKU_DEFINITIONS.filter(yaku => yaku.calc({
				house: house,
				handTiles: this.state.handTiles[house],
				huros: this.state.huros[house],
				tsumoTile: null,
				ronTile: this.state.hoTiles[callee].at(-1)!,
				riichi: this.state.riichis[house],
			}));
			console.log('yakus', house, yakus);
		}

		this.endKyoku();
	}

	public commit_dahai(house: House, tile: Tile, riichi = false) {
		if (this.state.turn !== house) throw new Error('Not your turn');

		if (riichi) {
			if (Utils.getHoraTiles(this.state.handTiles[house]).length === 0) throw new Error('Not tenpai');
			if (this.state.points[house] < 1000) throw new Error('Not enough points');
		}

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
					callee: house,
					callers: canRonHouses,
				};
			}
			if (canKanHouse != null) {
				this.state.kanAsking = {
					callee: house,
					caller: canKanHouse,
				};
			}
			if (canPonHouse != null) {
				this.state.ponAsking = {
					callee: house,
					caller: canPonHouse,
				};
			}
			if (canCiiHouse != null) {
				this.state.ciiAsking = {
					callee: house,
					caller: canCiiHouse,
				};
			}
			this.state.turn = null;
			this.state.nextTurnAfterAsking = Utils.nextHouse(house);
			return {
				asking: true as const,
				canRonHouses: canRonHouses,
				canKanHouse: canKanHouse,
				canPonHouse: canPonHouse,
				canCiiHouse: canCiiHouse,
			};
		}

		this.state.turn = Utils.nextHouse(house);

		const tsumoTile = this.tsumo();

		return {
			asking: false as const,
			tsumoTile: tsumoTile,
		};
	}

	public commit_kakan(house: House) {
	}

	/**
	 * ツモ和了
	 * @param house
	 */
	public commit_hora(house: House) {
		if (this.state.turn !== house) throw new Error('Not your turn');

		const yakus = Utils.getYakus(this.state.handTiles[house], null);

		this.endKyoku();
	}

	public commit_resolveCallAndRonInterruption(answers: {
		pon: boolean;
		cii: boolean;
		kan: boolean;
		ron: House[];
	}) {
		if (this.state.ponAsking == null && this.state.ciiAsking == null && this.state.kanAsking == null && this.state.ronAsking == null) throw new Error();

		const pon = this.state.ponAsking;
		const cii = this.state.ciiAsking;
		const kan = this.state.kanAsking;
		const ron = this.state.ronAsking;

		this.state.ponAsking = null;
		this.state.ciiAsking = null;
		this.state.kanAsking = null;
		this.state.ronAsking = null;

		if (ron != null && answers.ron.length > 0) {
			this.ron(answers.ron, ron.callee);
			return {
				type: 'ronned' as const,
				callers: ron.callers,
				callee: ron.callee,
				turn: null,
			};
		} else if (kan != null && answers.kan) {
			// 大明槓

			const tile = this.state.hoTiles[kan.callee].pop()!;
			this.state.huros[kan.caller].push({ type: 'minkan', tile, from: kan.callee });

			const rinsyan = this.tsumo();

			this.state.turn = kan.caller;
			return {
				type: 'kanned' as const,
				caller: kan.caller,
				callee: kan.callee,
				tile,
				rinsyan,
				turn: this.state.turn,
			};
		} else if (pon != null && answers.pon) {
			const tile = this.state.hoTiles[pon.callee].pop()!;
			this.state.handTiles[pon.caller].splice(this.state.handTiles[pon.caller].indexOf(tile), 1);
			this.state.handTiles[pon.caller].splice(this.state.handTiles[pon.caller].indexOf(tile), 1);
			this.state.huros[pon.caller].push({ type: 'pon', tile, from: pon.callee });

			this.state.turn = pon.caller;
			return {
				type: 'ponned' as const,
				caller: pon.caller,
				callee: pon.callee,
				tile,
				turn: this.state.turn,
			};
		} else if (cii != null && answers.cii) {
			const tile = this.state.hoTiles[cii.callee].pop()!;
			this.state.huros[cii.caller].push({ type: 'cii', tile, from: cii.callee });

			this.state.turn = cii.caller;
			return {
				type: 'ciied' as const,
				caller: cii.caller,
				callee: cii.callee,
				tile,
				turn: this.state.turn,
			};
		} else if (this.state.tiles.length === 0) {
			// 流局

			this.state.turn = null;
			this.state.nextTurnAfterAsking = null;

			this.endKyoku();

			return {
				type: 'ryukyoku' as const,
			};
		} else {
			this.state.turn = this.state.nextTurnAfterAsking!;
			this.state.nextTurnAfterAsking = null;

			const tile = this.tsumo();

			return {
				type: 'tsumo' as const,
				house: this.state.turn,
				tile,
				turn: this.state.turn,
			};
		}
	}

	public createPlayerState(index: 1 | 2 | 3 | 4): PlayerState {
		const house = this.getHouse(index);

		return {
			user1House: this.state.user1House,
			user2House: this.state.user2House,
			user3House: this.state.user3House,
			user4House: this.state.user4House,
			round: this.state.round,
			kyoku: this.state.kyoku,
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
