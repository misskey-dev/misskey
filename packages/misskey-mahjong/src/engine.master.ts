/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import CRC32 from 'crc-32';
import { TileType, House, Huro, TILE_TYPES, YAKU_DEFINITIONS, TileId } from './common.js';
import * as Common from './common.js';
import { PlayerState } from './engine.player.js';

//#region syntax suger
function $(tid: TileId): Common.TileInstance {
	return Common.findTileByIdOrFail(tid);
}

function $type(tid: TileId): TileType {
	return $(tid).t;
}
//#endregion

export type MasterState = {
	user1House: House;
	user2House: House;
	user3House: House;
	user4House: House;

	round: 'e' | 's' | 'w' | 'n';
	kyoku: number;
	turnCount: number;
	tiles: TileId[];
	kingTiles: TileId[];
	activatedDorasCount: number;

	/**
	 * 副露した牌を含まない手牌
	 */
	handTiles: {
		e: TileId[];
		s: TileId[];
		w: TileId[];
		n: TileId[];
	};

	hoTiles: {
		e: TileId[];
		s: TileId[];
		w: TileId[];
		n: TileId[];
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
	ippatsus: {
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
	askings: {
		ron: {
			/**
			 * 牌を捨てた人
			 */
			callee: House;

			/**
			 * ロンする権利がある人
			 */
			callers: House[];
		} | null;

		pon: {
			/**
			 * 牌を捨てた人
			 */
			callee: House;

			/**
			 * ポンする権利がある人
			 */
			caller: House;
		} | null;

		cii: {
			/**
			 * 牌を捨てた人
			 */
			callee: House;

			/**
			 * チーする権利がある人(calleeの下家なのは自明だがプログラム簡略化のため)
			 */
			caller: House;
		} | null;

		kan: {
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
};

export class MasterGameEngine {
	private state: MasterState;

	constructor(state: MasterState) {
		this.state = state;
	}

	public get doras(): TileType[] {
		return this.state.kingTiles.slice(0, this.state.activatedDorasCount)
			.map(id => Common.nextTileForDora($type(id)));
	}

	public get handTiles(): Record<House, TileId[]> {
		return this.state.handTiles;
	}

	public get handTileTypes(): Record<House, TileType[]> {
		return {
			e: this.state.handTiles.e.map(id => $type(id)),
			s: this.state.handTiles.s.map(id => $type(id)),
			w: this.state.handTiles.w.map(id => $type(id)),
			n: this.state.handTiles.n.map(id => $type(id)),
		};
	}

	public get hoTileTypes(): Record<House, TileType[]> {
		return {
			e: this.state.hoTiles.e.map(id => $type(id)),
			s: this.state.hoTiles.s.map(id => $type(id)),
			w: this.state.hoTiles.w.map(id => $type(id)),
			n: this.state.hoTiles.n.map(id => $type(id)),
		};
	}

	public get riichis(): Record<House, boolean> {
		return this.state.riichis;
	}

	public get askings(): MasterState['askings'] {
		return this.state.askings;
	}

	public get user1House(): House {
		return this.state.user1House;
	}

	public get user2House(): House {
		return this.state.user2House;
	}

	public get user3House(): House {
		return this.state.user3House;
	}

	public get user4House(): House {
		return this.state.user4House;
	}

	public get turn(): House | null {
		return this.state.turn;
	}

	public static createInitialState(): MasterState {
		const ikasama: TileId[] = [125, 129, 9, 56, 57, 61, 77, 81, 85, 133, 134, 135, 121, 122];

		const tiles = [...Common.TILE_ID_MAP.keys()];
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
		const kingTiles = tiles.splice(0, 14);

		return {
			user1House: 'e',
			user2House: 's',
			user3House: 'w',
			user4House: 'n',
			round: 'e',
			kyoku: 1,
			turnCount: 0,
			tiles,
			kingTiles,
			activatedDorasCount: 1,
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
			askings: {
				ron: null,
				pon: null,
				cii: null,
				kan: null,
			},
		};
	}

	private tsumo(): TileId {
		const tile = this.state.tiles.pop();
		if (tile == null) throw new Error('No tiles left');
		if (this.state.turn == null) throw new Error('Not your turn');
		this.state.handTiles[this.state.turn].push(tile);
		return tile;
	}

	private canRon(house: House, tid: TileId): boolean {
		// フリテン
		// TODO: ポンされるなどして自分の河にない場合の考慮
		if (this.hoTileTypes[house].includes($type(tid))) return false;

		const horaSets = Common.getHoraSets(this.handTileTypes[house].concat($type(tid)));
		if (horaSets.length === 0) return false; // 完成形じゃない

		// TODO
		//const yakus = YAKU_DEFINITIONS.filter(yaku => yaku.calc(this.state, { tsumoTile: null, ronTile: tile }));
		//if (yakus.length === 0) return false; // 役がない

		return true;
	}

	private canPon(house: House, tid: TileId): boolean {
		return this.handTileTypes[house].filter(t => t === $type(tid)).length === 2;
	}

	private canDaiminkan(caller: House, tid: TileId): boolean {
		return this.handTileTypes[caller].filter(t => t === $type(tid)).length === 3;
	}

	private canCii(caller: House, callee: House, tid: TileId): boolean {
		if (callee !== Common.prevHouse(caller)) return false;
		const hand = this.handTileTypes[caller];
		return Common.SHUNTU_PATTERNS.some(pattern =>
			pattern.includes($type(tid)) &&
			pattern.filter(t => hand.includes(t)).length >= 2);
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

	/**
	 * ロン和了
	 * @param callers ロンする人
	 * @param callee ロンされる人
	 */
	private ronHora(callers: House[], callee: House) {
		for (const house of callers) {
			const yakus = YAKU_DEFINITIONS.filter(yaku => yaku.calc({
				house: house,
				handTiles: this.handTileTypes[house],
				huros: this.state.huros[house],
				tsumoTile: null,
				ronTile: this.hoTileTypes[callee].at(-1)!,
				riichi: this.state.riichis[house],
			}));
			const doraCount =
				Common.calcOwnedDoraCount(this.handTileTypes[house], this.state.huros[house], this.doras) +
				Common.calcRedDoraCount(this.state.handTiles[house], this.state.huros[house]);
			const fans = yakus.map(yaku => yaku.fan).reduce((a, b) => a + b, 0) + doraCount;
			const point = Common.fanToPoint(fans, house === 'e');
			this.state.points[callee] -= point;
			this.state.points[house] += point;
			console.log('fans point', fans, point);
			console.log('yakus', house, yakus);
		}

		this.endKyoku();
	}

	public startTransaction() {
		const newState = structuredClone(this.state);
		return {
			state: newState,
			commit: () => {
				this.state = newState;
			},
		};
	}

	public commit_nextKyoku() {
		const newState = MasterGameEngine.createInitialState();
		newState.kyoku = this.state.kyoku + 1;
		newState.points = this.state.points;
		newState.turn = 'e';
		newState.user1House = Common.nextHouse(this.state.user1House);
		newState.user2House = Common.nextHouse(this.state.user2House);
		newState.user3House = Common.nextHouse(this.state.user3House);
		newState.user4House = Common.nextHouse(this.state.user4House);
		this.state = newState;
	}

	public commit_dahai(house: House, tid: TileId, riichi = false) {
		const { state, commit } = this.startTransaction();

		if (this.state.turn !== house) throw new Error('Not your turn');

		if (riichi) {
			if (this.state.riichis[house]) throw new Error('Already riichi');
			const tempHandTiles = [...this.handTileTypes[house]];
			tempHandTiles.splice(tempHandTiles.indexOf($type(tid)), 1);
			if (Common.getHoraTiles(tempHandTiles).length === 0) throw new Error('Not tenpai');
			if (this.state.points[house] < 1000) throw new Error('Not enough points');
		}

		const handTiles = this.state.handTiles[house];
		if (!handTiles.includes(tid)) throw new Error('No such tile in your hand');
		handTiles.splice(handTiles.indexOf(tid), 1);
		this.state.hoTiles[house].push(tid);

		if (this.state.riichis[house]) {
			this.state.ippatsus[house] = false;
		}

		if (riichi) {
			this.state.riichis[house] = true;
			this.state.ippatsus[house] = true;
		}

		const canRonHouses: House[] = [];
		switch (house) {
			case 'e':
				if (this.canRon('s', tid)) canRonHouses.push('s');
				if (this.canRon('w', tid)) canRonHouses.push('w');
				if (this.canRon('n', tid)) canRonHouses.push('n');
				break;
			case 's':
				if (this.canRon('e', tid)) canRonHouses.push('e');
				if (this.canRon('w', tid)) canRonHouses.push('w');
				if (this.canRon('n', tid)) canRonHouses.push('n');
				break;
			case 'w':
				if (this.canRon('e', tid)) canRonHouses.push('e');
				if (this.canRon('s', tid)) canRonHouses.push('s');
				if (this.canRon('n', tid)) canRonHouses.push('n');
				break;
			case 'n':
				if (this.canRon('e', tid)) canRonHouses.push('e');
				if (this.canRon('s', tid)) canRonHouses.push('s');
				if (this.canRon('w', tid)) canRonHouses.push('w');
				break;
		}

		let canKanHouse: House | null = null;
		switch (house) {
			case 'e': canKanHouse = this.canDaiminkan('s', tid) ? 's' : this.canDaiminkan('w', tid) ? 'w' : this.canDaiminkan('n', tid) ? 'n' : null; break;
			case 's': canKanHouse = this.canDaiminkan('e', tid) ? 'e' : this.canDaiminkan('w', tid) ? 'w' : this.canDaiminkan('n', tid) ? 'n' : null; break;
			case 'w': canKanHouse = this.canDaiminkan('e', tid) ? 'e' : this.canDaiminkan('s', tid) ? 's' : this.canDaiminkan('n', tid) ? 'n' : null; break;
			case 'n': canKanHouse = this.canDaiminkan('e', tid) ? 'e' : this.canDaiminkan('s', tid) ? 's' : this.canDaiminkan('w', tid) ? 'w' : null; break;
		}

		let canPonHouse: House | null = null;
		switch (house) {
			case 'e': canPonHouse = this.canPon('s', tid) ? 's' : this.canPon('w', tid) ? 'w' : this.canPon('n', tid) ? 'n' : null; break;
			case 's': canPonHouse = this.canPon('e', tid) ? 'e' : this.canPon('w', tid) ? 'w' : this.canPon('n', tid) ? 'n' : null; break;
			case 'w': canPonHouse = this.canPon('e', tid) ? 'e' : this.canPon('s', tid) ? 's' : this.canPon('n', tid) ? 'n' : null; break;
			case 'n': canPonHouse = this.canPon('e', tid) ? 'e' : this.canPon('s', tid) ? 's' : this.canPon('w', tid) ? 'w' : null; break;
		}

		let canCiiHouse: House | null = null;
		switch (house) {
			case 'e': canCiiHouse = this.canCii('s', house, tid) ? 's' : this.canCii('w', house, tid) ? 'w' : this.canCii('n', house, tid) ? 'n' : null; break;
			case 's': canCiiHouse = this.canCii('e', house, tid) ? 'e' : this.canCii('w', house, tid) ? 'w' : this.canCii('n', house, tid) ? 'n' : null; break;
			case 'w': canCiiHouse = this.canCii('e', house, tid) ? 'e' : this.canCii('s', house, tid) ? 's' : this.canCii('n', house, tid) ? 'n' : null; break;
			case 'n': canCiiHouse = this.canCii('e', house, tid) ? 'e' : this.canCii('s', house, tid) ? 's' : this.canCii('w', house, tid) ? 'w' : null; break;
		}

		if (canRonHouses.length > 0 || canKanHouse != null || canPonHouse != null || canCiiHouse != null) {
			if (canRonHouses.length > 0) {
				this.state.askings.ron = {
					callee: house,
					callers: canRonHouses,
				};
			}
			if (canKanHouse != null) {
				this.state.askings.kan = {
					callee: house,
					caller: canKanHouse,
				};
			}
			if (canPonHouse != null) {
				this.state.askings.pon = {
					callee: house,
					caller: canPonHouse,
				};
			}
			if (canCiiHouse != null) {
				this.state.askings.cii = {
					callee: house,
					caller: canCiiHouse,
				};
			}
			this.state.turn = null;
			this.state.nextTurnAfterAsking = Common.nextHouse(house);
			return {
				asking: true as const,
				canRonHouses: canRonHouses,
				canKanHouse: canKanHouse,
				canPonHouse: canPonHouse,
				canCiiHouse: canCiiHouse,
			};
		}

		// 流局
		if (this.state.tiles.length === 0) {
			this.state.turn = null;

			this.endKyoku();

			return {
				asking: false as const,
				ryuukyoku: true as const,
			};
		}

		this.state.turn = Common.nextHouse(house);

		const tsumoTile = this.tsumo();

		return {
			asking: false as const,
			tsumoTile: tsumoTile,
			next: this.state.turn,
		};
	}

	public commit_kakan(house: House, tid: TileId) {
		const pon = this.state.huros[house].find(h => h.type === 'pon' && $type(h.tiles[0]) === $type(tid));
		if (pon == null) throw new Error('No such pon');
		this.state.handTiles[house].splice(this.state.handTiles[house].indexOf(tid), 1);
		const tiles = [tid, ...pon.tiles];
		this.state.huros[house].push({ type: 'minkan', tiles: tiles, from: pon.from });

		this.state.ippatsus.e = false;
		this.state.ippatsus.s = false;
		this.state.ippatsus.w = false;
		this.state.ippatsus.n = false;

		this.state.activatedDorasCount++;

		const rinsyan = this.tsumo();

		return {
			rinsyan,
			tiles,
			from: pon.from,
		};
	}

	public commit_ankan(house: House, tid: TileId) {
		const t1 = this.state.handTiles[house].filter(t => $type(t) === $type(tid)).at(0);
		if (t1 == null) throw new Error('No such tile');
		const t2 = this.state.handTiles[house].filter(t => $type(t) === $type(tid)).at(1);
		if (t2 == null) throw new Error('No such tile');
		const t3 = this.state.handTiles[house].filter(t => $type(t) === $type(tid)).at(2);
		if (t3 == null) throw new Error('No such tile');
		const t4 = this.state.handTiles[house].filter(t => $type(t) === $type(tid)).at(3);
		if (t4 == null) throw new Error('No such tile');
		this.state.handTiles[house].splice(this.state.handTiles[house].indexOf(t1), 1);
		this.state.handTiles[house].splice(this.state.handTiles[house].indexOf(t2), 1);
		this.state.handTiles[house].splice(this.state.handTiles[house].indexOf(t3), 1);
		this.state.handTiles[house].splice(this.state.handTiles[house].indexOf(t4), 1);
		const tiles = [t1, t2, t3, t4];
		this.state.huros[house].push({ type: 'ankan', tiles: tiles });

		this.state.ippatsus.e = false;
		this.state.ippatsus.s = false;
		this.state.ippatsus.w = false;
		this.state.ippatsus.n = false;

		this.state.activatedDorasCount++;

		const rinsyan = this.tsumo();

		return {
			rinsyan,
			tiles,
		};
	}

	/**
	 * ツモ和了
	 * @param house
	 */
	public commit_tsumoHora(house: House) {
		if (this.state.turn !== house) throw new Error('Not your turn');

		const yakus = YAKU_DEFINITIONS.filter(yaku => yaku.calc({
			house: house,
			handTiles: this.handTileTypes[house],
			huros: this.state.huros[house],
			tsumoTile: this.handTileTypes[house].at(-1)!,
			ronTile: null,
			riichi: this.state.riichis[house],
		}));
		const doraCount =
			Common.calcOwnedDoraCount(this.handTileTypes[house], this.state.huros[house], this.doras) +
			Common.calcRedDoraCount(this.state.handTiles[house], this.state.huros[house]);
		const fans = yakus.map(yaku => yaku.fan).reduce((a, b) => a + b, 0) + doraCount;
		const pointDeltas = Common.calcTsumoHoraPointDeltas(house, fans);
		this.state.points.e += pointDeltas.e;
		this.state.points.s += pointDeltas.s;
		this.state.points.w += pointDeltas.w;
		this.state.points.n += pointDeltas.n;
		console.log('yakus', house, yakus);

		this.endKyoku();

		return {
			handTiles: this.state.handTiles[house],
			tsumoTile: this.state.handTiles[house].at(-1)!,
		};
	}

	public commit_resolveCallingInterruption(answers: {
		pon: boolean;
		cii: false | 'x__' | '_x_' | '__x';
		kan: boolean;
		ron: House[];
	}) {
		if (this.state.askings.pon == null && this.state.askings.cii == null && this.state.askings.kan == null && this.state.askings.ron == null) throw new Error();

		const pon = this.state.askings.pon;
		const cii = this.state.askings.cii;
		const kan = this.state.askings.kan;
		const ron = this.state.askings.ron;

		this.state.askings.pon = null;
		this.state.askings.cii = null;
		this.state.askings.kan = null;
		this.state.askings.ron = null;

		if (ron != null && answers.ron.length > 0) {
			this.ronHora(answers.ron, ron.callee);
			return {
				type: 'ronned' as const,
				callers: ron.callers,
				callee: ron.callee,
				turn: null,
			};
		} else if (kan != null && answers.kan) {
			// 大明槓

			const tile = this.state.hoTiles[kan.callee].pop()!;
			const t1 = this.state.handTiles[kan.caller].filter(t => $type(t) === $type(tile)).at(0);
			if (t1 == null) throw new Error('No such tile');
			const t2 = this.state.handTiles[kan.caller].filter(t => $type(t) === $type(tile)).at(1);
			if (t2 == null) throw new Error('No such tile');
			const t3 = this.state.handTiles[kan.caller].filter(t => $type(t) === $type(tile)).at(2);
			if (t3 == null) throw new Error('No such tile');

			this.state.handTiles[kan.caller].splice(this.state.handTiles[kan.caller].indexOf(t1), 1);
			this.state.handTiles[kan.caller].splice(this.state.handTiles[kan.caller].indexOf(t2), 1);
			this.state.handTiles[kan.caller].splice(this.state.handTiles[kan.caller].indexOf(t3), 1);

			const tiles = [tile, t1, t2, t3];
			this.state.huros[kan.caller].push({ type: 'minkan', tiles: tiles, from: kan.callee });

			this.state.ippatsus.e = false;
			this.state.ippatsus.s = false;
			this.state.ippatsus.w = false;
			this.state.ippatsus.n = false;

			this.state.activatedDorasCount++;

			const rinsyan = this.tsumo();

			this.state.turn = kan.caller;

			return {
				type: 'kanned' as const,
				caller: kan.caller,
				callee: kan.callee,
				tiles: tiles,
				rinsyan,
				turn: this.state.turn,
			};
		} else if (pon != null && answers.pon) {
			const tile = this.state.hoTiles[pon.callee].pop()!;
			const t1 = this.state.handTiles[pon.caller].filter(t => $type(t) === $type(tile)).at(0);
			if (t1 == null) throw new Error('No such tile');
			const t2 = this.state.handTiles[pon.caller].filter(t => $type(t) === $type(tile)).at(1);
			if (t2 == null) throw new Error('No such tile');

			this.state.handTiles[pon.caller].splice(this.state.handTiles[pon.caller].indexOf(t1), 1);
			this.state.handTiles[pon.caller].splice(this.state.handTiles[pon.caller].indexOf(t2), 1);

			const tiles = [tile, t1, t2];
			this.state.huros[pon.caller].push({ type: 'pon', tiles: tiles, from: pon.callee });

			this.state.ippatsus.e = false;
			this.state.ippatsus.s = false;
			this.state.ippatsus.w = false;
			this.state.ippatsus.n = false;

			this.state.turn = pon.caller;

			return {
				type: 'ponned' as const,
				caller: pon.caller,
				callee: pon.callee,
				tiles: tiles,
				turn: this.state.turn,
			};
		} else if (cii != null && answers.cii) {
			const tile = this.state.hoTiles[cii.callee].pop()!;
			let tiles: [TileId, TileId, TileId];

			switch (answers.cii) {
				case 'x__': {
					const a = Common.NEXT_TILE_FOR_SHUNTSU[$type(tile)];
					if (a == null) throw new Error();
					const b = Common.NEXT_TILE_FOR_SHUNTSU[a];
					if (b == null) throw new Error();
					const aTile = this.state.handTiles[cii.caller].find(t => $type(t) === a);
					if (aTile == null) throw new Error();
					const bTile = this.state.handTiles[cii.caller].find(t => $type(t) === b);
					if (bTile == null) throw new Error();
					this.state.handTiles[cii.caller].splice(this.state.handTiles[cii.caller].indexOf(aTile), 1);
					this.state.handTiles[cii.caller].splice(this.state.handTiles[cii.caller].indexOf(bTile), 1);
					tiles = [tile, aTile, bTile];
					break;
				}
				case '_x_': {
					const a = Common.PREV_TILE_FOR_SHUNTSU[$type(tile)];
					if (a == null) throw new Error();
					const b = Common.NEXT_TILE_FOR_SHUNTSU[$type(tile)];
					if (b == null) throw new Error();
					const aTile = this.state.handTiles[cii.caller].find(t => $type(t) === a);
					if (aTile == null) throw new Error();
					const bTile = this.state.handTiles[cii.caller].find(t => $type(t) === b);
					if (bTile == null) throw new Error();
					this.state.handTiles[cii.caller].splice(this.state.handTiles[cii.caller].indexOf(aTile), 1);
					this.state.handTiles[cii.caller].splice(this.state.handTiles[cii.caller].indexOf(bTile), 1);
					tiles = [aTile, tile, bTile];
					break;
				}
				case '__x': {
					const a = Common.PREV_TILE_FOR_SHUNTSU[$type(tile)];
					if (a == null) throw new Error();
					const b = Common.PREV_TILE_FOR_SHUNTSU[a];
					if (b == null) throw new Error();
					const aTile = this.state.handTiles[cii.caller].find(t => $type(t) === a);
					if (aTile == null) throw new Error();
					const bTile = this.state.handTiles[cii.caller].find(t => $type(t) === b);
					if (bTile == null) throw new Error();
					this.state.handTiles[cii.caller].splice(this.state.handTiles[cii.caller].indexOf(aTile), 1);
					this.state.handTiles[cii.caller].splice(this.state.handTiles[cii.caller].indexOf(bTile), 1);
					tiles = [bTile, aTile, tile];
					break;
				}
			}

			this.state.huros[cii.caller].push({ type: 'cii', tiles: tiles, from: cii.callee });

			this.state.ippatsus.e = false;
			this.state.ippatsus.s = false;
			this.state.ippatsus.w = false;
			this.state.ippatsus.n = false;

			this.state.turn = cii.caller;

			return {
				type: 'ciied' as const,
				caller: cii.caller,
				callee: cii.callee,
				tiles: tiles,
				turn: this.state.turn,
			};
		} else if (this.state.tiles.length === 0) {
			// 流局

			this.state.turn = null;
			this.state.nextTurnAfterAsking = null;

			this.endKyoku();

			return {
				type: 'ryuukyoku' as const,
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
			turnCount: this.state.turnCount,
			tilesCount: this.state.tiles.length,
			doraIndicateTiles: this.state.kingTiles.slice(0, this.state.activatedDorasCount),
			handTiles: {
				e: house === 'e' ? this.state.handTiles.e : this.state.handTiles.e.map(() => 0),
				s: house === 's' ? this.state.handTiles.s : this.state.handTiles.s.map(() => 0),
				w: house === 'w' ? this.state.handTiles.w : this.state.handTiles.w.map(() => 0),
				n: house === 'n' ? this.state.handTiles.n : this.state.handTiles.n.map(() => 0),
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

	public getState(): MasterState {
		return structuredClone(this.state);
	}
}

function commit_dahai(state: MasterState): MasterState {

}
