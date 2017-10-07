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

class LineBot extends BotCore {
	private replyToken: string;

	private reply(messages: any[]) {
		request.post({
			url: 'https://api.line.me/v2/bot/message/reply',
			headers: {
				'Authorization': `Bearer ${config.line_bot.channel_access_token}`
			},
			json: {
				replyToken: this.replyToken,
				messages: messages
			}
		}, (err, res, body) => {
			if (err) {
				console.error(err);
				return;
			}
		});
	}

	public async react(ev: any): Promise<void> {
		// テキスト以外(スタンプなど)は無視
		if (ev.message.type !== 'text') return;

		const res = await this.q(ev.message.text);

		if (res == null) return;

		// 返信
		this.reply([{
			type: 'text',
			text: res
		}]);
	}

	public static import(data) {
		const bot = new LineBot();
		bot._import(data);
		return bot;
	}

	public async showUserCommand(q: string) {
		const user = await require('../endpoints/users/show')({
			username: q.substr(1)
		}, this.user);

		this.reply([{
			type: 'template',
			altText: await super.showUserCommand(q),
			template: {
				type: 'buttons',
				thumbnailImageUrl: `${user.avatar_url}?thumbnail&size=1024`,
				title: `${user.name} (@${user.username})`,
				text: user.description || '(no description)',
				actions: [{
					type: 'uri',
					label: 'Webで見る',
					uri: `${config.url}/${user.username}`
				}]
			}
		}]);
	}
}

module.exports = async (app: express.Application) => {
	if (config.line_bot == null) return;

	const handler = new EventEmitter();

	handler.on('message', async (ev) => {

		const sourceId = ev.source.userId;
		const sessionId = `line-bot-sessions:${sourceId}`;

		const _session = await redis.get(sessionId);
		let bot: LineBot;

		if (_session == null) {
			const user = await User.findOne({
				line: {
					user_id: sourceId
				}
			});

			bot = new LineBot(user);

			bot.on('signin', user => {
				User.update(user._id, {
					$set: {
						line: {
							user_id: sourceId
						}
					}
				});
			});

			bot.on('signout', user => {
				User.update(user._id, {
					$set: {
						line: {
							user_id: null
						}
					}
				});
			});

			redis.set(sessionId, JSON.stringify(bot.export()));
		} else {
			bot = LineBot.import(JSON.parse(_session));
		}

		bot.on('updated', () => {
			redis.set(sessionId, JSON.stringify(bot.export()));
		});

		bot.react(ev);
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
