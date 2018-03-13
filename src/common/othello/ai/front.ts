/**
 * -AI-
 * Botのフロントエンド(ストリームとの対話を担当)
 *
 * 対話と思考を同じプロセスで行うと、思考時間が長引いたときにストリームから
 * 切断されてしまうので、別々のプロセスで行うようにします
 */

import * as childProcess from 'child_process';
import * as WebSocket from 'ws';
import * as request from 'request-promise-native';
import conf from '../../../conf';

// 設定 ////////////////////////////////////////////////////////

/**
 * BotアカウントのAPIキー
 */
const i = conf.othello_ai.i;

/**
 * BotアカウントのユーザーID
 */
const id = conf.othello_ai.id;

////////////////////////////////////////////////////////////////

/**
 * ホームストリーム
 */
const homeStream = new WebSocket(`wss://api.misskey.xyz/?i=${i}`);

homeStream.on('open', () => {
	console.log('home stream opened');
});

homeStream.on('close', () => {
	console.log('home stream closed');
});

homeStream.on('message', message => {
	const msg = JSON.parse(message.toString());

	// タイムライン上でなんか言われたまたは返信されたとき
	if (msg.type == 'mention' || msg.type == 'reply') {
		const post = msg.body;

		// リアクションする
		request.post('https://api.misskey.xyz/posts/reactions/create', {
			json: { i,
				post_id: post.id,
				reaction: 'love'
			}
		});

		if (post.text) {
			if (post.text.indexOf('オセロ') > -1) {
				request.post('https://api.misskey.xyz/posts/create', {
					json: { i,
						reply_id: post.id,
						text: '良いですよ～'
					}
				});

				invite(post.user_id);
			}
		}
	}

	// メッセージでなんか言われたとき
	if (msg.type == 'messaging_message') {
		const message = msg.body;
		if (message.text) {
			if (message.text.indexOf('オセロ') > -1) {
				request.post('https://api.misskey.xyz/messaging/messages/create', {
					json: { i,
						user_id: message.user_id,
						text: '良いですよ～'
					}
				});

				invite(message.user_id);
			}
		}
	}
});

// ユーザーを対局に誘う
function invite(userId) {
	request.post('https://api.misskey.xyz/othello/match', {
		json: { i,
			user_id: userId
		}
	});
}

/**
 * オセロストリーム
 */
const othelloStream = new WebSocket(`wss://api.misskey.xyz/othello?i=${i}`);

othelloStream.on('open', () => {
	console.log('othello stream opened');
});

othelloStream.on('close', () => {
	console.log('othello stream closed');
});

othelloStream.on('message', message => {
	const msg = JSON.parse(message.toString());

	// 招待されたとき
	if (msg.type == 'invited') {
		onInviteMe(msg.body.parent);
	}

	// マッチしたとき
	if (msg.type == 'matched') {
		gameStart(msg.body);
	}
});

/**
 * ゲーム開始
 * @param game ゲーム情報
 */
function gameStart(game) {
	// ゲームストリームに接続
	const gw = new WebSocket(`wss://api.misskey.xyz/othello-game?i=${i}&game=${game.id}`);

	gw.on('open', () => {
		console.log('othello game stream opened');

		// フォーム
		const form = [{
			id: 'strength',
			type: 'radio',
			label: '強さ',
			value: 2,
			items: [{
				label: '接待',
				value: 0
			}, {
				label: '弱',
				value: 1
			}, {
				label: '中',
				value: 2
			}, {
				label: '強',
				value: 3
			}, {
				label: '最強',
				value: 5
			}]
		}];

		//#region バックエンドプロセス開始
		const ai = childProcess.fork(__dirname + '/back.js');

		// バックエンドプロセスに情報を渡す
		ai.send({
			type: '_init_',
			game,
			form,
			id
		});

		ai.on('message', msg => {
			if (msg.type == 'put') {
				gw.send(JSON.stringify({
					type: 'set',
					pos: msg.pos
				}));
			} else if (msg.type == 'tl') {
				request.post('https://api.misskey.xyz/posts/create', {
					json: { i,
						text: msg.text
					}
				});
			} else if (msg.type == 'close') {
				gw.close();
			}
		});

		// ゲームストリームから情報が流れてきたらそのままバックエンドプロセスに伝える
		gw.on('message', message => {
			const msg = JSON.parse(message.toString());
			ai.send(msg);
		});
		//#endregion

		// フォーム初期化
		setTimeout(() => {
			gw.send(JSON.stringify({
				type: 'init-form',
				body: form
			}));
		}, 1000);

		// どんな設定内容の対局でも受け入れる
		setTimeout(() => {
			gw.send(JSON.stringify({
				type: 'accept'
			}));
		}, 2000);
	});

	gw.on('close', () => {
		console.log('othello game stream closed');
	});
}

/**
 * オセロの対局に招待されたとき
 * @param inviter 誘ってきたユーザー
 */
async function onInviteMe(inviter) {
	console.log(`Anybody invited me: @${inviter.username}`);

	// 承認
	const game = await request.post('https://api.misskey.xyz/othello/match', {
		json: {
			i,
			user_id: inviter.id
		}
	});

	gameStart(game);
}
