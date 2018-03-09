export type Color = 'black' | 'white';
export type MapPixel = 'null' | 'empty';

export type Options = {
	isLlotheo: boolean;
};

/**
 * オセロエンジン
 */
export default class Othello {
	public map: MapPixel[];
	public mapWidth: number;
	public mapHeight: number;
	public board: Color[];
	public turn: Color = 'black';
	public opts: Options;

	public prevPos = -1;
	public stats: Array<{
		b: number;
		w: number;
	}>;

	/**
	 * ゲームを初期化します
	 */
	constructor(map: string[], opts: Options) {
		this.opts = opts;

		this.mapWidth = map[0].length;
		this.mapHeight = map.length;
		const mapData = map.join('');

		// Parse map data
		this.board = mapData.split('').map(d => {
			if (d == '-') return null;
			if (d == 'b') return 'black';
			if (d == 'w') return 'white';
			return undefined;
		});
		this.map = mapData.split('').map(d => {
			if (d == '-' || d == 'b' || d == 'w') return 'empty';
			return 'null';
		});

		// Init stats
		this.stats = [{
			b: this.blackP,
			w: this.whiteP
		}];
	}

	/**
	 * 黒石の数
	 */
	public get blackCount() {
		return this.board.filter(x => x == 'black').length;
	}

	/**
	 * 白石の数
	 */
	public get whiteCount() {
		return this.board.filter(x => x == 'white').length;
	}

	/**
	 * 黒石の比率
	 */
	public get blackP() {
		return this.blackCount / (this.blackCount + this.whiteCount);
	}

	/**
	 * 白石の比率
	 */
	public get whiteP() {
		return this.whiteCount / (this.blackCount + this.whiteCount);
	}

	public transformPosToXy(pos: number): number[] {
		const x = pos % this.mapWidth;
		const y = Math.floor(pos / this.mapHeight);
		return [x, y];
	}

	public transformXyToPos(x: number, y: number): number {
		return x + (y * this.mapHeight);
	}

	/**
	 * 指定のマスに石を書き込みます
	 * @param color 石の色
	 * @param pos 位置
	 */
	private write(color: Color, pos: number) {
		this.board[pos] = color;
	}

	/**
	 * 指定のマスに石を打ちます
	 * @param color 石の色
	 * @param pos 位置
	 */
	public put(color: Color, pos: number) {
		if (!this.canPut(color, pos)) return;

		this.prevPos = pos;
		this.write(color, pos);

		// 反転させられる石を取得
		const reverses = this.effects(color, pos);

		// 反転させる
		reverses.forEach(pos => {
			this.write(color, pos);
		});

		this.stats.push({
			b: this.blackP,
			w: this.whiteP
		});

		// ターン計算
		const opColor = color == 'black' ? 'white' : 'black';
		if (this.canPutSomewhere(opColor).length > 0) {
			this.turn = color == 'black' ? 'white' : 'black';
		} else if (this.canPutSomewhere(color).length > 0) {
			this.turn = color == 'black' ? 'black' : 'white';
		} else {
			this.turn = null;
		}
	}

	/**
	 * 指定したマスの状態を取得します
	 * @param pos 位置
	 */
	public get(pos: number) {
		return this.board[pos];
	}

	/**
	 * 指定した位置のマップデータのマスを取得します
	 * @param pos 位置
	 */
	public mapDataGet(pos: number): MapPixel {
		if (pos < 0 || pos >= this.map.length) return 'null';
		return this.map[pos];
	}

	/**
	 * 打つことができる場所を取得します
	 */
	public canPutSomewhere(color: Color): number[] {
		const result = [];

		this.board.forEach((x, i) => {
			if (this.canPut(color, i)) result.push(i);
		});

		return result;
	}

	/**
	 * 指定のマスに石を打つことができるかどうか(相手の石を1つでも反転させられるか)を取得します
	 * @param color 自分の色
	 * @param pos 位置
	 */
	public canPut(color: Color, pos: number): boolean {
		// 既に石が置いてある場所には打てない
		if (this.get(pos) !== null) return false;
		return this.effects(color, pos).length !== 0;
	}

	/**
	 * 指定のマスに石を置いた時の、反転させられる石を取得します
	 * @param color 自分の色
	 * @param pos 位置
	 */
	private effects(color: Color, pos: number): number[] {
		const enemyColor = color == 'black' ? 'white' : 'black';
		const [x, y] = this.transformPosToXy(pos);
		let stones = [];

		const iterate = (fn: (i: number) => number[]) => {
			let i = 1;
			const found = [];
			while (true) {
				const [x, y] = fn(i);
				if (x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight) break;
				const pos = this.transformXyToPos(x, y);
				const pixel = this.mapDataGet(pos);
				if (pixel == 'null') break;
				const stone = this.get(pos);
				if (stone == null) break;
				if (stone == enemyColor) found.push(pos);
				if (stone == color) {
					stones = stones.concat(found);
					break;
				}
				i++;
			}
		};

		iterate(i => [x    , y - i]); // 上
		iterate(i => [x + i, y - i]); // 右上
		iterate(i => [x + i, y    ]); // 右
		iterate(i => [x + i, y + i]); // 右下
		iterate(i => [x    , y + i]); // 下
		iterate(i => [x - i, y + i]); // 左下
		iterate(i => [x - i, y    ]); // 左
		iterate(i => [x - i, y - i]); // 左上

		return stones;
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
			return this.blackCount > this.whiteCount ? 'white' : 'black';
		} else {
			return this.blackCount > this.whiteCount ? 'black' : 'white';
		}
	}
}
