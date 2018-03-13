/**
 * -AI-
 * Botのバックエンド(思考を担当)
 *
 * 対話と思考を同じプロセスで行うと、思考時間が長引いたときにストリームから
 * 切断されてしまうので、別々のプロセスで行うようにします
 */

import Othello, { Color } from '../core';

let game;
let form;

/**
 * このBotのユーザーID
 */
let id;

process.on('message', msg => {
	console.log(msg);

	// 親プロセスからデータをもらう
	if (msg.type == '_init_') {
		game = msg.game;
		form = msg.form;
		id = msg.id;
	}

	// フォームが更新されたとき
	if (msg.type == 'update-form') {
		form.find(i => i.id == msg.body.id).value = msg.body.value;
	}

	// ゲームが始まったとき
	if (msg.type == 'started') {
		onGameStarted(msg.body);

		//#region TLに投稿する
		const game = msg.body;
		const url = `https://misskey.xyz/othello/${game.id}`;
		const user = game.user1_id == id ? game.user2 : game.user1;
		const isSettai = form[0].value === 0;
		const text = isSettai
			? `?[${user.name}](https://misskey.xyz/${user.username})さんの接待を始めました！`
			: `対局を?[${user.name}](https://misskey.xyz/${user.username})さんと始めました！ (強さ${form[0].value})`;
		process.send({
			type: 'tl',
			text: `${text}\n→[観戦する](${url})`
		});
		//#endregion
	}

	// ゲームが終了したとき
	if (msg.type == 'ended') {
		// ストリームから切断
		process.send({
			type: 'close'
		});

		//#region TLに投稿する
		const url = `https://misskey.xyz/othello/${msg.body.game.id}`;
		const user = game.user1_id == id ? game.user2 : game.user1;
		const isSettai = form[0].value === 0;
		const text = isSettai
			? msg.body.winner_id === null
				? `?[${user.name}](https://misskey.xyz/${user.username})さんに接待で引き分けました...`
				: msg.body.winner_id == id
					? `?[${user.name}](https://misskey.xyz/${user.username})さんに接待で勝ってしまいました...`
					: `?[${user.name}](https://misskey.xyz/${user.username})さんに接待で負けてあげました♪`
			: msg.body.winner_id === null
				? `?[${user.name}](https://misskey.xyz/${user.username})さんと引き分けました～ (強さ${form[0].value})`
				: msg.body.winner_id == id
					? `?[${user.name}](https://misskey.xyz/${user.username})さんに勝ちました♪ (強さ${form[0].value})`
					: `?[${user.name}](https://misskey.xyz/${user.username})さんに負けました... (強さ${form[0].value})`;
		process.send({
			type: 'tl',
			text: `${text}\n→[結果を見る](${url})`
		});
		//#endregion
	}

	// 打たれたとき
	if (msg.type == 'set') {
		onSet(msg.body);
	}
});

let o: Othello;
let botColor: Color;

// 各マスの強さ
let cellStrongs;

/**
 * ゲーム開始時
 * @param g ゲーム情報
 */
function onGameStarted(g) {
	game = g;

	// オセロエンジン初期化
	o = new Othello(game.settings.map, {
		isLlotheo: game.settings.is_llotheo,
		canPutEverywhere: game.settings.can_put_everywhere,
		loopedBoard: game.settings.looped_board
	});

	// 各マスの価値を計算しておく
	cellStrongs = o.map.map((pix, i) => {
		if (pix == 'null') return 0;
		const [x, y] = o.transformPosToXy(i);
		let count = 0;
		const get = (x, y) => {
			if (x < 0 || y < 0 || x >= o.mapWidth || y >= o.mapHeight) return 'null';
			return o.mapDataGet(o.transformXyToPos(x, y));
		};

		if (get(x    , y - 1) == 'null') count++;
		if (get(x + 1, y - 1) == 'null') count++;
		if (get(x + 1, y    ) == 'null') count++;
		if (get(x + 1, y + 1) == 'null') count++;
		if (get(x    , y + 1) == 'null') count++;
		if (get(x - 1, y + 1) == 'null') count++;
		if (get(x - 1, y    ) == 'null') count++;
		if (get(x - 1, y - 1) == 'null') count++;
		//return Math.pow(count, 3);
		return count >= 5 ? 1 : 0;
	});

	botColor = game.user1_id == id && game.black == 1 || game.user2_id == id && game.black == 2;

	if (botColor) {
		think();
	}
}

function onSet(x) {
	o.put(x.color, x.pos, true);

	if (x.next === botColor) {
		think();
	}
}

function think() {
	console.log('Thinking...');

	const isSettai = form[0].value === 0;

	// 接待モードのときは、全力(5手先読みくらい)で負けるようにする
	const maxDepth = isSettai ? 5 : form[0].value;

	const db = {};

	/**
	 * αβ法での探索
	 */
	const dive = (o: Othello, pos: number, alpha = -Infinity, beta = Infinity, depth = 0): number => {
		// 試し打ち
		const undo = o.put(o.turn, pos, true);

		const key = o.board.toString();
		let cache = db[key];
		if (cache) {
			if (alpha >= cache.upper) {
				o.undo(undo);
				return cache.upper;
			}
			if (beta <= cache.lower) {
				o.undo(undo);
				return cache.lower;
			}
			alpha = Math.max(alpha, cache.lower);
			beta = Math.min(beta, cache.upper);
		} else {
			cache = {
				upper: Infinity,
				lower: -Infinity
			};
		}

		const isBotTurn = o.turn === botColor;

		// 勝った
		if (o.turn === null) {
			const winner = o.winner;

			// 勝つことによる基本スコア
			const base = 10000;

			let score;

			if (game.settings.is_llotheo) {
				// 勝ちは勝ちでも、より自分の石を少なくした方が美しい勝ちだと判定する
				score = o.winner ? base - (o.blackCount * 100) : base - (o.whiteCount * 100);
			} else {
				// 勝ちは勝ちでも、より相手の石を少なくした方が美しい勝ちだと判定する
				score = o.winner ? base + (o.blackCount * 100) : base + (o.whiteCount * 100);
			}

			// 巻き戻し
			o.undo(undo);

			// 接待なら自分が負けた方が高スコア
			return isSettai
				? winner !== botColor ? score : -score
				: winner === botColor ? score : -score;
		}

		if (depth === maxDepth) {
			let score = o.canPutSomewhere(botColor).length;

			cellStrongs.forEach((s, i) => {
				// 係数
				const coefficient = 30;
				s = s * coefficient;

				const stone = o.board[i];
				if (stone === botColor) {
					// TODO: 価値のあるマスに設置されている自分の石に縦か横に接するマスは価値があると判断する
					score += s;
				} else if (stone !== null) {
					score -= s;
				}
			});

			// 巻き戻し
			o.undo(undo);

			// ロセオならスコアを反転
			if (game.settings.is_llotheo) score = -score;

			// 接待ならスコアを反転
			if (isSettai) score = -score;

			return score;
		} else {
			const cans = o.canPutSomewhere(o.turn);

			let value = isBotTurn ? -Infinity : Infinity;
			let a = alpha;
			let b = beta;

			// 次のターンのプレイヤーにとって最も良い手を取得
			for (const p of cans) {
				if (isBotTurn) {
					const score = dive(o, p, a, beta, depth + 1);
					value = Math.max(value, score);
					a = Math.max(a, value);
					if (value >= beta) break;
				} else {
					const score = dive(o, p, alpha, b, depth + 1);
					value = Math.min(value, score);
					b = Math.min(b, value);
					if (value <= alpha) break;
				}
			}

			// 巻き戻し
			o.undo(undo);

			if (value <= alpha) {
				cache.upper = value;
			} else if (value >= beta) {
				cache.lower = value;
			} else {
				cache.upper = value;
				cache.lower = value;
			}

			db[key] = cache;

			return value;
		}
	};

	const cans = o.canPutSomewhere(botColor);
	const scores = cans.map(p => dive(o, p));
	const pos = cans[scores.indexOf(Math.max(...scores))];

	console.log('Thinked:', pos);

	process.send({
		type: 'put',
		pos
	});
}
