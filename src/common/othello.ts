import * as EventEmitter from 'events';

export default class Othello extends EventEmitter {
	public board: Array<Array<'black' | 'white'>>;

	/**
	 * ゲームを初期化します
	 */
	constructor() {
		super();

		this.board = [
			[null, null, null, null, null, null, null, null],
			[null, null, null, null, null, null, null, null],
			[null, null, null, null, null, null, null, null],
			[null, null, null, 'black', 'white', null, null, null],
			[null, null, null, 'white', 'black', null, null, null],
			[null, null, null, null, null, null, null, null],
			[null, null, null, null, null, null, null, null],
			[null, null, null, null, null, null, null, null]
		];
	}

	public setByNumber(color, n) {
		const ps = this.getPattern(color);
		this.set(color, ps[n][0], ps[n][1]);
	}

	/**
	 * 石を配置します
	 */
	public set(color, x, y) {
		this.board[y][x] = color;

		const reverses = this.getReverse(color, x, y);

		reverses.forEach(r => {
			switch (r[0]) {
				case 0: // 上
					for (let c = 0, _y = y - 1; c < r[1]; c++, _y--) {
						this.board[_y][x] = color;
					}
					break;

				case 1: // 右上
					for (let c = 0, i = 1; c < r[1]; c++, i++) {
						this.board[y - i][x + i] = color;
					}
					break;

				case 2: // 右
					for (let c = 0, _x = x + 1; c < r[1]; c++, _x++) {
						this.board[y][_x] = color;
					}
					break;

				case 3: // 右下
					for (let c = 0, i = 1; c < r[1]; c++, i++) {
						this.board[y + i][x + i] = color;
					}
					break;

				case 4: // 下
					for (let c = 0, _y = y + 1; c < r[1]; c++, _y++) {
						this.board[_y][x] = color;
					}
					break;

				case 5: // 左下
					for (let c = 0, i = 1; c < r[1]; c++, i++) {
						this.board[y + i][x - i] = color;
					}
					break;

				case 6: // 左
					for (let c = 0, _x = x - 1; c < r[1]; c++, _x--) {
						this.board[y][_x] = color;
					}
					break;

				case 7: // 左上
					for (let c = 0, i = 1; c < r[1]; c++, i++) {
						this.board[y - i][x - i] = color;
					}
					break;
				}
		});

		this.emit('set:' + color, x, y);
	}

	/**
	 * 打つことができる場所を取得します
	 */
	public getPattern(myColor): number[][] {
		const result = [];
		this.board.forEach((stones, y) => stones.forEach((stone, x) => {
			if (stone != null) return;
			if (this.canReverse(myColor, x, y)) result.push([x, y]);
		}));
		return result;
	}

	/**
	 * 指定の位置に石を打つことができるかどうか(相手の石を1つでも反転させられるか)を取得します
	 */
	public canReverse(myColor, targetx, targety): boolean {
		return this.getReverse(myColor, targetx, targety) !== null;
	}

	private getReverse(myColor, targetx, targety): number[] {
		const opponentColor = myColor == 'black' ? 'white' : 'black';

		const createIterater = () => {
			let opponentStoneFound = false;
			let breaked = false;
			return (x, y): any => {
				if (breaked) {
					return;
				} else if (this.board[y][x] == myColor && opponentStoneFound) {
					return true;
				} else if (this.board[y][x] == myColor && !opponentStoneFound) {
					breaked = true;
				} else if (this.board[y][x] == opponentColor) {
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
		for (let c = 0, i = 1; i < Math.min(8 - targetx, targety); c++, i++) {
			if (iterate(targetx + i, targety - i)) {
				res.push([1, c]);
				break;
			}
		}

		// 右
		iterate = createIterater();
		for (let c = 0, x = targetx + 1; x < 8; c++, x++) {
			if (iterate(x, targety)) {
				res.push([2, c]);
				break;
			}
		}

		// 右下
		iterate = createIterater();
		for (let c = 0, i = 1; i < Math.min(8 - targetx, 8 - targety); c++, i++) {
			if (iterate(targetx + i, targety + i)) {
				res.push([3, c]);
				break;
			}
		}

		// 下
		iterate = createIterater();
		for (let c = 0, y = targety + 1; y < 8; c++, y++) {
			if (iterate(targetx, y)) {
				res.push([4, c]);
				break;
			}
		}

		// 左下
		iterate = createIterater();
		for (let c = 0, i = 1; i < Math.min(targetx, 8 - targety); c++, i++) {
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
		for (let c = 0, i = 1; i < Math.min(targetx, targety); c++, i++) {
			if (iterate(targetx - i, targety - i)) {
				res.push([7, c]);
				break;
			}
		}

		return res.length === 0 ? null : res;
	}

	public toString(): string {
		//return this.board.map(row => row.map(state => state === 'black' ? '●' : state === 'white' ? '○' : '┼').join('')).join('\n');
		return this.board.map(row => row.map(state => state === 'black' ? '⚫️' : state === 'white' ? '⚪️' : '🔹').join('')).join('\n');
	}

	public toPatternString(color): string {
		//const num = ['０', '１', '２', '３', '４', '５', '６', '７', '８', '９'];
		const num = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

		const pattern = this.getPattern(color);

		return this.board.map((row, y) => row.map((state, x) => {
			const i = pattern.findIndex(p => p[0] == x && p[1] == y);
			//return state === 'black' ? '●' : state === 'white' ? '○' : i != -1 ? num[i] : '┼';
			return state === 'black' ? '⚫️' : state === 'white' ? '⚪️' : i != -1 ? num[i] : '🔹';
		}).join('')).join('\n');
	}
}
/*
export class Ai {
	private othello: Othello;
	private color: string;
	private opponentColor: string;

	constructor(color: string, othello: Othello) {
		this.othello = othello;
		this.color = color;
		this.opponentColor = this.color == 'black' ? 'white' : 'black';

		this.othello.on('set:' + this.opponentColor, () => {
			this.turn();
		});

		if (this.color == 'black') {
			this.turn();
		}
	}

	public turn() {
		const ps = this.othello.getPattern(this.color);
		if (ps.length > 0) {
			const p = ps[Math.floor(Math.random() * ps.length)];
			this.othello.set(this.color, p[0], p[1]);

			// 相手の打つ場所がない場合続けてAIのターン
			if (this.othello.getPattern(this.opponentColor).length === 0) {
				this.turn();
			}
		}
	}
}
*/
export function ai(color: string, othello: Othello) {
	const opponentColor = color == 'black' ? 'white' : 'black';

	function think() {
		const ps = othello.getPattern(color);
		if (ps.length > 0) {
			const p = ps[Math.floor(Math.random() * ps.length)];
			othello.set(color, p[0], p[1]);

			// 相手の打つ場所がない場合続けてAIのターン
			if (othello.getPattern(opponentColor).length === 0) {
				think();
			}
		}
	}
}
