/**
 * -AI-
 * Botのフロントエンド(ストリームとの対話を担当)
 *
 * 対話と思考を同じプロセスで行うと、思考時間が長引いたときにストリームから
 * 切断されてしまうので、別々のプロセスで行うようにします
 */

import * as childProcess from 'child_process';
const WebSocket = require('ws');
import * as ReconnectingWebSocket from 'reconnecting-websocket';
import * as request from 'request-promise-native';
import conf from '../../config';

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
const homeStream = new ReconnectingWebSocket(`${conf.ws_url}/?i=${i}`, undefined, {
	constructor: WebSocket
});

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

		if (post.userId == id) return;

		// リアクションする
		request.post(`${conf.api_url}/posts/reactions/create`, {
			json: { i,
				postId: post.id,
				reaction: 'love'
			}
		});

		if (post.text) {
			if (post.text.indexOf('オセロ') > -1) {
				request.post(`${conf.api_url}/posts/create`, {
					json: { i,
						replyId: post.id,
						text: '良いですよ～'
					}
				});

				invite(post.userId);
			}
		}
	}

	// メッセージでなんか言われたとき
	if (msg.type == 'messaging_message') {
		const message = msg.body;
		if (message.text) {
			if (message.text.indexOf('オセロ') > -1) {
				request.post(`${conf.api_url}/messaging/messages/create`, {
					json: { i,
						userId: message.userId,
						text: '良いですよ～'
					}
				});

				invite(message.userId);
			}
		}
	}
});

// ユーザーを対局に誘う
function invite(userId) {
	request.post(`${conf.api_url}/othello/match`, {
		json: { i,
			userId: userId
		}
	});
}

/**
 * オセロストリーム
 */
const othelloStream = new ReconnectingWebSocket(`${conf.ws_url}/othello?i=${i}`, undefined, {
	constructor: WebSocket
});

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
	const gw = new ReconnectingWebSocket(`${conf.ws_url}/othello-game?i=${i}&game=${game.id}`, undefined, {
		constructor: WebSocket
	});

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
			form
		});

		ai.on('message', msg => {
			if (msg.type == 'put') {
				gw.send(JSON.stringify({
					type: 'set',
					pos: msg.pos
				}));
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
	console.log(`Someone invited me: @${inviter.username}`);

	// 承認
	const game = await request.post(`${conf.api_url}/othello/match`, {
		json: {
			i,
			userId: inviter.id
		}
	});

	gameStart(game);
}
