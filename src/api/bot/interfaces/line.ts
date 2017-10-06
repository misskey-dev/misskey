import * as EventEmitter from 'events';
import * as express from 'express';
import * as request from 'request';
import * as crypto from 'crypto';
//import User from '../../models/user';
import config from '../../../conf';
import BotCore from '../core';

const sessions: Array<{
	sourceId: string;
	session: BotCore;
}> = [];

module.exports = async (app: express.Application) => {
	if (config.line_bot == null) return;

	const handler = new EventEmitter();

	handler.on('message', async (ev) => {
		// テキスト以外(スタンプなど)は無視
		if (ev.message.type !== 'text') return;

		const sourceId = ev.source.userId;
		let session = sessions.find(s => {
			return s.sourceId === sourceId;
		});

		if (!session) {
			session = {
				sourceId: sourceId,
				session: new BotCore()
			};

			sessions.push(session);
		}

		const res = await session.session.q(ev.message.text);

		request({
			url: 'https://api.line.me/v2/bot/message/reply',
			headers: {
				'Authorization': `Bearer ${config.line_bot.channel_access_token}`
			},
			json: {
				replyToken: ev.replyToken,
				messages: [{
					type: 'text',
					text: res
				}]
			}
		}, (err, res, body) => {
			if (err) {
				console.error(err);
				return;
			}
		});
	});

	app.post('/hooks/line', (req, res, next) => {
		// req.headers['x-line-signature'] は常に string ですが、型定義の都合上
		// string | string[] になっているので string を明示しています
		const sig1 = req.headers['x-line-signature'] as string;

		const hash = crypto.createHmac('SHA256', config.line_bot.channel_secret)
			.update((req as any).rawBody);

		const sig2 = hash.digest('base64');

		// シグネチャ比較
		if (sig1 === sig2) {
			req.body.events.forEach(ev => {
				handler.emit(ev.type, ev);
			});

			res.sendStatus(200);
		} else {
			res.sendStatus(400);
		}
	});
};
