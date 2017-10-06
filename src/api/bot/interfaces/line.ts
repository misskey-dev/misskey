import * as EventEmitter from 'events';
import * as express from 'express';
import * as request from 'request';
import * as crypto from 'crypto';
import User from '../../models/user';
import config from '../../../conf';
import BotCore from '../core';
import _redis from '../../../db/redis';
import prominence = require('prominence');

const redis = prominence(_redis);

module.exports = async (app: express.Application) => {
	if (config.line_bot == null) return;

	const handler = new EventEmitter();

	handler.on('message', async (ev) => {
		// テキスト以外(スタンプなど)は無視
		if (ev.message.type !== 'text') return;

		const sourceId = ev.source.userId;
		const sessionId = `line-bot-sessions:${sourceId}`;

		const _session = await redis.get(sessionId);
		let session: BotCore;

		if (_session == null) {
			const user = await User.findOne({
				line: {
					user_id: sourceId
				}
			});

			session = new BotCore(user);

			session.on('signin', user => {
				User.update(user._id, {
					$set: {
						line: {
							user_id: sourceId
						}
					}
				});
			});

			session.on('signout', user => {
				User.update(user._id, {
					$set: {
						line: {
							user_id: null
						}
					}
				});
			});

			redis.set(sessionId, JSON.stringify(session.export()));
		} else {
			session = BotCore.import(JSON.parse(_session));
		}

		session.on('updated', () => {
			redis.set(sessionId, JSON.stringify(session.export()));
		});

		const res = await session.q(ev.message.text);

		// 返信
		request.post({
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
