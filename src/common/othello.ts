const BOARD_SIZE = 8;

export default class Othello {
	public board: Array<'black' | 'white'>;

	public stats: Array<{
		b: number;
		w: number;
	}> = [];

	/**
	 * ゲームを初期化します
	 */
	constructor() {
		this.board = [
			null, null, null, null, null, null, null, null,
			null, null, null, null, null, null, null, null,
			null, null, null, null, null, null, null, null,
			null, null, null, 'white', 'black', null, null, null,
			null, null, null, 'black', 'white', null, null, null,
			null, null, null, null, null, null, null, null,
			null, null, null, null, null, null, null, null,
			null, null, null, null, null, null, null, null
		];

		this.stats.push({
			b: 0.5,
			w: 0.5
		});
	}

	public prevPos = -1;

	public get blackCount() {
		return this.board.filter(s => s == 'black').length;
	}

	public get whiteCount() {
		return this.board.filter(s => s == 'white').length;
	}

	public get blackP() {
		return this.blackCount / (this.blackCount + this.whiteCount);
	}

	public get whiteP() {
		return this.whiteCount / (this.blackCount + this.whiteCount);
	}

	public setByNumber(color, n) {
		const ps = this.getPattern(color);
		this.set2(color, ps[n][0], ps[n][1]);
	}

	private write(color, x, y) {
		const pos = x + (y * 8);
		this.board[pos] = color;
	}

	/**
	 * 石を配置します
	 */
	public set2(color, x, y) {
		this.prevPos = x + (y * 8);
		this.write(color, x, y);

		const reverses = this.getReverse(color, x, y);

		reverses.forEach(r => {
			switch (r[0]) {
				case 0: // 上
					for (let c = 0, _y = y - 1; c < r[1]; c++, _y--) {
						this.write(color, x, _y);
					}
					break;

				case 1: // 右上
					for (let c = 0, i = 1; c < r[1]; c++, i++) {
						this.write(color, x + i, y - i);
					}
					break;

				case 2: // 右
					for (let c = 0, _x = x + 1; c < r[1]; c++, _x++) {
						this.write(color, _x, y);
					}
					break;

				case 3: // 右下
					for (let c = 0, i = 1; c < r[1]; c++, i++) {
						this.write(color, x + i, y + i);
					}
					break;

				case 4: // 下
					for (let c = 0, _y = y + 1; c < r[1]; c++, _y++) {
						this.write(color, x, _y);
					}
					break;

				case 5: // 左下
					for (let c = 0, i = 1; c < r[1]; c++, i++) {
						this.write(color, x - i, y + i);
					}
					break;

				case 6: // 左
					for (let c = 0, _x = x - 1; c < r[1]; c++, _x--) {
						this.write(color, _x, y);
					}
					break;

				case 7: // 左上
					for (let c = 0, i = 1; c < r[1]; c++, i++) {
						this.write(color, x - i, y - i);
					}
					break;
				}
		});

		this.stats.push({
			b: this.blackP,
			w: this.whiteP
		});
	}

	public set(color, pos) {
		const x = pos % BOARD_SIZE;
		const y = Math.floor(pos / BOARD_SIZE);
		this.set2(color, x, y);
	}

	public get(x, y) {
		const pos = x + (y * 8);
		return this.board[pos];
	}

	/**
	 * 打つことができる場所を取得します
	 */
	public getPattern(myColor): number[][] {
		const result = [];
		this.board.forEach((stone, i) => {
			if (stone != null) return;
			const x = i % BOARD_SIZE;
			const y = Math.floor(i / BOARD_SIZE);
			if (this.canReverse2(myColor, x, y)) result.push([x, y]);
		});
		return result;
	}

	/**
	 * 指定の位置に石を打つことができるかどうか(相手の石を1つでも反転させられるか)を取得します
	 */
	public canReverse2(myColor, x, y): boolean {
		return this.canReverse(myColor, x + (y * 8));
	}
	public canReverse(myColor, pos): boolean {
		if (this.board[pos] != null) return false;
		const x = pos % BOARD_SIZE;
		const y = Math.floor(pos / BOARD_SIZE);
		return this.getReverse(myColor, x, y) !== null;
	}

	private getReverse(myColor, targetx, targety): number[] {
		const opponentColor = myColor == 'black' ? 'white' : 'black';

		const createIterater = () => {
			let opponentStoneFound = false;
			let breaked = false;
			return (x, y): any => {
				if (breaked) {
					return;
				} else if (this.get(x, y) == myColor && opponentStoneFound) {
					return true;
				} else if (this.get(x, y) == myColor && !opponentStoneFound) {
					breaked = true;
				} else if (this.get(x, y) == opponentColor) {
					opponentStoneFound = true;
				} else {
					breaked = true;
				}
			};
		};

		const res = [];

		let iterate;

		// 上
		iterate = createIterater();
		for (let c = 0, y = targety - 1; y >= 0; c++, y--) {
			if (iterate(targetx, y)) {
				res.push([0, c]);
				break;
			}
		}

		// 右上
		iterate = createIterater();
		for (let c = 0, i = 1; i <= Math.min(BOARD_SIZE - targetx, targety); c++, i++) {
			if (iterate(targetx + i, targety - i)) {
				res.push([1, c]);
				break;
			}
		}

		// 右
		iterate = createIterater();
		for (let c = 0, x = targetx + 1; x < BOARD_SIZE; c++, x++) {
			if (iterate(x, targety)) {
				res.push([2, c]);
				break;
			}
		}

		// 右下
		iterate = createIterater();
		for (let c = 0, i = 1; i <= Math.min(BOARD_SIZE - targetx, BOARD_SIZE - targety); c++, i++) {
			if (iterate(targetx + i, targety + i)) {
				res.push([3, c]);
				break;
			}
		}

		// 下
		iterate = createIterater();
		for (let c = 0, y = targety + 1; y < BOARD_SIZE; c++, y++) {
			if (iterate(targetx, y)) {
				res.push([4, c]);
				break;
			}
		}

		// 左下
		iterate = createIterater();
		for (let c = 0, i = 1; i <= Math.min(targetx, BOARD_SIZE - targety); c++, i++) {
			if (iterate(targetx - i, targety + i)) {
				res.push([5, c]);
				break;
			}
		}

		// 左
		iterate = createIterater();
		for (let c = 0, x = targetx - 1; x >= 0; c++, x--) {
			if (iterate(x, targety)) {
				res.push([6, c]);
				break;
			}
		}

		// 左上
		iterate = createIterater();
		for (let c = 0, i = 1; i <= Math.min(targetx, targety); c++, i++) {
			if (iterate(targetx - i, targety - i)) {
				res.push([7, c]);
				break;
			}
		}

		return res.length === 0 ? null : res;
	}

	public toString(): string {
		//return this.board.map(row => row.map(state => state === 'black' ? '●' : state === 'white' ? '○' : '┼').join('')).join('\n');
		//return this.board.map(row => row.map(state => state === 'black' ? '⚫️' : state === 'white' ? '⚪️' : '🔹').join('')).join('\n');
		return 'wip';
	}

	public toPatternString(color): string {
		//const num = ['０', '１', '２', '３', '４', '５', '６', '７', '８', '９'];
		/*const num = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🍍'];

		const pattern = this.getPattern(color);

		return this.board.map((row, y) => row.map((state, x) => {
			const i = pattern.findIndex(p => p[0] == x && p[1] == y);
			//return state === 'black' ? '●' : state === 'white' ? '○' : i != -1 ? num[i] : '┼';
			return state === 'black' ? '⚫️' : state === 'white' ? '⚪️' : i != -1 ? num[i] : '🔹';
		}).join('')).join('\n');*/

		return 'wip';
	}
}

export function ai(color: string, othello: Othello) {
	const opponentColor = color == 'black' ? 'white' : 'black';

	function think() {
		// 打てる場所を取得
		const ps = othello.getPattern(color);

		if (ps.length > 0) { // 打てる場所がある場合
			// 角を取得
			const corners = ps.filter(p =>
				// 左上
				(p[0] == 0 && p[1] == 0) ||
				// 右上
				(p[0] == (BOARD_SIZE - 1) && p[1] == 0) ||
				// 右下
				(p[0] == (BOARD_SIZE - 1) && p[1] == (BOARD_SIZE - 1)) ||
				// 左下
				(p[0] == 0 && p[1] == (BOARD_SIZE - 1))
			);

			if (corners.length > 0) { // どこかしらの角に打てる場合
				// 打てる角からランダムに選択して打つ
				const p = corners[Math.floor(Math.random() * corners.length)];
				othello.set(color, p[0], p[1]);
			} else { // 打てる角がない場合
				// 打てる場所からランダムに選択して打つ
				const p = ps[Math.floor(Math.random() * ps.length)];
				othello.set(color, p[0], p[1]);
			}

			// 相手の打つ場所がない場合続けてAIのターン
			if (othello.getPattern(opponentColor).length === 0) {
				think();
			}
		}
	}

	think();
}
