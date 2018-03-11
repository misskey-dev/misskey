export type Color = 'black' | 'white';
export type MapPixel = 'null' | 'empty';

export type Options = {
	isLlotheo: boolean;
	canPutEverywhere: boolean;
	loopedBoard: boolean;
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
			if (d == 'b') return 'black';
			if (d == 'w') return 'white';
			return undefined;
		});

		this.map = mapData.split('').map(d => {
			if (d == '-' || d == 'b' || d == 'w') return 'empty';
			return 'null';
		});
		//#endregion

		// Init stats
		this.stats = [{
			b: this.blackP,
			w: this.whiteP
		}];

		// ゲームが始まった時点で片方の色の石しかないか、始まった時点で勝敗が決定するようなマップの場合がある
		if (this.canPutSomewhere('black').length == 0) {
			if (this.canPutSomewhere('white').length == 0) {
				this.turn = null;
			} else {
				this.turn = 'white';
			}
		}
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
		const [x, y] = this.transformPosToXy(pos);
		if (x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight) return 'null';
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
	 * 指定のマスに石を打つことができるかどうかを取得します
	 * @param color 自分の色
	 * @param pos 位置
	 */
	public canPut(color: Color, pos: number): boolean {
		// 既に石が置いてある場所には打てない
		if (this.get(pos) !== null) return false;

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
	 * @param pos 位置
	 */
	private effects(color: Color, pos: number): number[] {
		const enemyColor = color == 'black' ? 'white' : 'black';

		// ひっくり返せる石(の位置)リスト
		let stones = [];

		const initPos = pos;

		// 走査
		const iterate = (fn: (i: number) => number[]) => {
			let i = 1;
			const found = [];

			while (true) {
				let [x, y] = fn(i);

				// 座標が指し示す位置がボード外に出たとき
				if (this.opts.loopedBoard) {
					if (x <  0             ) x = this.mapWidth - ((-x) % this.mapWidth);
					if (y <  0             ) y = this.mapHeight - ((-y) % this.mapHeight);
					if (x >= this.mapWidth ) x = x % this.mapWidth;
					if (y >= this.mapHeight) y = y % this.mapHeight;

					// for debug
					//if (x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight) {
					//	console.log(x, y);
					//}

					// 一周して自分に帰ってきたら
					if (this.transformXyToPos(x, y) == initPos) {
						// ↓のコメントアウトを外すと、「現時点で自分の石が隣接していないが、
						// そこに置いたとするとループして最終的に挟んだことになる」というケースを有効化します。(Test4のマップで違いが分かります)
						// このケースを有効にした方が良いのか無効にした方が良いのか判断がつかなかったためとりあえず無効としておきます
						// (あと無効な方がゲームとしておもしろそうだった)
						stones = stones.concat(found);
						break;
					}
				} else {
					if (x == -1 || y == -1 || x == this.mapWidth || y == this.mapHeight) break;
				}

				const pos = this.transformXyToPos(x, y);

				//#region 「配置不能」マスに当たった場合走査終了
				const pixel = this.mapDataGet(pos);
				if (pixel == 'null') break;
				//#endregion

				// 石取得
				const stone = this.get(pos);

				// 石が置かれていないマスなら走査終了
				if (stone == null) break;

				// 相手の石なら「ひっくり返せるかもリスト」に入れておく
				if (stone == enemyColor) found.push(pos);

				// 自分の石なら「ひっくり返せるかもリスト」を「ひっくり返せるリスト」に入れ、走査終了
				if (stone == color) {
					stones = stones.concat(found);
					break;
				}
				i++;
			}
		};

		const [x, y] = this.transformPosToXy(pos);

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
