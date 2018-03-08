import Othello, { Color } from './core';

export function ai(color: Color, othello: Othello) {
	//const opponentColor = color == 'black' ? 'white' : 'black';
/* wip

	function think() {
		// 打てる場所を取得
		const ps = othello.canPutSomewhere(color);

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

	think();*/
}
