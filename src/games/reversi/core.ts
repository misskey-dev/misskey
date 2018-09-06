import { count, concat } from "../../prelude/array";

// MISSKEY REVERSI ENGINE

/**
 * true ... 黒
 * false ... 白
 */
export type Color = boolean;
const BLACK = true;
const WHITE = false;

export type MapPixel = 'null' | 'empty';

export type Options = {
	isLlotheo: boolean;
	canPutEverywhere: boolean;
	loopedBoard: boolean;
};

export type Undo = {
	/**
	 * 色
	 */
	color: Color;

	/**
	 * どこに打ったか
	 */
	pos: number;

	/**
	 * 反転した石の位置の配列
	 */
	effects: number[];

	/**
	 * ターン
	 */
	turn: Color;
};

/**
 * リバーシエンジン
 */
export default class Reversi {
	public map: MapPixel[];
	public mapWidth: number;
	public mapHeight: number;
	public board: Color[];
	public turn: Color = BLACK;
	public opts: Options;

	public prevPos = -1;
	public prevColor: Color = null;

	private logs: Undo[] = [];

	/**
	 * ゲームを初期化します
	 */
	constructor(map: string[], opts: Options) {
		//#region binds
		this.put = this.put.bind(this);
		//#endregion

		//#region Options
		this.opts = opts;
		if (this.opts.isLlotheo == null) this.opts.isLlotheo = false;
		if (this.opts.canPutEverywhere == null) this.opts.canPutEverywhere = false;
		if (this.opts.loopedBoard == null) this.opts.loopedBoard = false;
		//#endregion

		//#region Parse map data
		this.mapWidth = map[0].length;
		this.mapHeight = map.length;
		const mapData = map.join('');

		this.board = mapData.split('').map(d => {
			if (d == '-') return null;
			if (d == 'b') return BLACK;
			if (d == 'w') return WHITE;
			return undefined;
		});

		this.map = mapData.split('').map(d => {
			if (d == '-' || d == 'b' || d == 'w') return 'empty';
			return 'null';
		});
		//#endregion

		// ゲームが始まった時点で片方の色の石しかないか、始まった時点で勝敗が決定するようなマップの場合がある
		if (!this.canPutSomewhere(BLACK)) {
			if (!this.canPutSomewhere(WHITE)) {
				this.turn = null;
			} else {
				this.turn = WHITE;
			}
		}
	}

	/**
	 * 黒石の数
	 */
	public get blackCount() {
		return count(BLACK, this.board);
	}

	/**
	 * 白石の数
	 */
	public get whiteCount() {
		return count(WHITE, this.board);
	}

	/**
	 * 黒石の比率
	 */
	public get blackP() {
		if (this.blackCount == 0 && this.whiteCount == 0) return 0;
		return this.blackCount / (this.blackCount + this.whiteCount);
	}

	/**
	 * 白石の比率
	 */
	public get whiteP() {
		if (this.blackCount == 0 && this.whiteCount == 0) return 0;
		return this.whiteCount / (this.blackCount + this.whiteCount);
	}

	public transformPosToXy(pos: number): number[] {
		const x = pos % this.mapWidth;
		const y = Math.floor(pos / this.mapWidth);
		return [x, y];
	}

	public transformXyToPos(x: number, y: number): number {
		return x + (y * this.mapWidth);
	}

	/**
	 * 指定のマスに石を打ちます
	 * @param color 石の色
	 * @param pos 位置
	 */
	public put(color: Color, pos: number) {
		this.prevPos = pos;
		this.prevColor = color;

		this.board[pos] = color;

		// 反転させられる石を取得
		const effects = this.effects(color, pos);

		// 反転させる
		for (const pos of effects) {
			this.board[pos] = color;
		}

		const turn = this.turn;

		this.logs.push({
			color,
			pos,
			effects,
			turn
		});

		this.calcTurn();
	}

	private calcTurn() {
		// ターン計算
		if (this.canPutSomewhere(!this.prevColor)) {
			this.turn = !this.prevColor;
		} else if (this.canPutSomewhere(this.prevColor)) {
			this.turn = this.prevColor;
		} else {
			this.turn = null;
		}
	}

	public undo() {
		const undo = this.logs.pop();
		this.prevColor = undo.color;
		this.prevPos = undo.pos;
		this.board[undo.pos] = null;
		for (const pos of undo.effects) {
			const color = this.board[pos];
			this.board[pos] = !color;
		}
		this.turn = undo.turn;
	}

	/**
	 * 指定した位置のマップデータのマスを取得します
	 * @param pos 位置
	 */
	public mapDataGet(pos: number): MapPixel {
		const [x, y] = this.transformPosToXy(pos);
		if (x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight) return 'null';
		return this.map[pos];
	}

	/**
	 * 打つことができる場所を取得します
	 */
	public puttablePlaces(color: Color): number[] {
		return Array.from(this.board.keys()).filter(i => this.canPut(color, i));
	}

	/**
	 * 打つことができる場所があるかどうかを取得します
	 */
	public canPutSomewhere(color: Color): boolean {
		return this.puttablePlaces(color).length > 0;
	}

	/**
	 * 指定のマスに石を打つことができるかどうかを取得します
	 * @param color 自分の色
	 * @param pos 位置
	 */
	public canPut(color: Color, pos: number): boolean {
		// 既に石が置いてある場所には打てない
		if (this.board[pos] !== null) return false;

		if (this.opts.canPutEverywhere) {
			// 挟んでなくても置けるモード
			return this.mapDataGet(pos) == 'empty';
		} else {
			// 相手の石を1つでも反転させられるか
			return this.effects(color, pos).length !== 0;
		}
	}

	/**
	 * 指定のマスに石を置いた時の、反転させられる石を取得します
	 * @param color 自分の色
	 * @param initPos 位置
	 */
	public effects(color: Color, initPos: number): number[] {
		const enemyColor = !color;

		const diffVectors: [number, number][] = [
			[  0,  -1], // 上
			[ +1,  -1], // 右上
			[ +1,   0], // 右
			[ +1,  +1], // 右下
			[  0,  +1], // 下
			[ -1,  +1], // 左下
			[ -1,   0], // 左
			[ -1,  -1]  // 左上
		];

		const effectsInLine = ([dx, dy]: [number, number]): number[] => {
			const nextPos = (x: number, y: number): [number, number] => [x + dx, y + dy];

			const found: number[] = []; // 挟めるかもしれない相手の石を入れておく配列
			let [x, y] = this.transformPosToXy(initPos);
			while (true) {
				// 座標が指し示す位置がボード外に出たとき
				if (this.opts.loopedBoard) {
					x = ((x % this.mapWidth) + this.mapWidth) % this.mapWidth;
					y = ((y % this.mapHeight) + this.mapHeight) % this.mapHeight;

					if (this.transformXyToPos(x, y) == initPos) {
						// 盤面の境界でループし、自分が石を置く位置に戻ってきたとき、挟めるようにしている (ref: Test4のマップ)
						return found;
					}
				} else {
					if (x == -1 || y == -1 || x == this.mapWidth || y == this.mapHeight) {
						return []; // 挟めないことが確定 (盤面外に到達)
					}
				}

				const pos = this.transformXyToPos(x, y);
				if (this.mapDataGet(pos) === 'null') return []; // 挟めないことが確定 (配置不可能なマスに到達)
				const stone = this.board[pos];
				if (stone === null) return []; // 挟めないことが確定 (石が置かれていないマスに到達)
				if (stone === enemyColor) found.push(pos); // 挟めるかもしれない (相手の石を発見)
				if (stone === color) return found; // 挟めることが確定 (対となる自分の石を発見)

				[x, y] = nextPos(x, y);
			}
		};

		return concat(diffVectors.map(effectsInLine));
	}

	/**
	 * ゲームが終了したか否か
	 */
	public get isEnded(): boolean {
		return this.turn === null;
	}

	/**
	 * ゲームの勝者 (null = 引き分け)
	 */
	public get winner(): Color {
		if (!this.isEnded) return undefined;

		if (this.blackCount == this.whiteCount) return null;

		if (this.opts.isLlotheo) {
			return this.blackCount > this.whiteCount ? WHITE : BLACK;
		} else {
			return this.blackCount > this.whiteCount ? BLACK : WHITE;
		}
	}
}
