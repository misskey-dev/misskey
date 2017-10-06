import * as EventEmitter from 'events';
import * as express from 'express';
import * as crypto from 'crypto';
//import User from '../../models/user';
import config from '../../../conf';
/*import BotCore from '../core';

const sessions: {
	userId: string;
	session: BotCore;
}[] = [];
*/
module.exports = async (app: express.Application) => {
	if (config.line_bot == null) return;

	const handler = new EventEmitter();

	app.post('/hooks/line', (req, res, next) => {
		// req.headers['X-Line-Signature'] は常に string ですが、型定義の都合上
		// string | string[] になっているので string を明示しています
		const sig1 = req.headers['X-Line-Signature'] as string;

		const hash = crypto.createHmac('sha256', config.line_bot.channel_secret)
			.update(JSON.stringify(req.body));

		const sig2 = hash.digest('base64');

		// シグネチャ比較
		if (sig1 === sig2) {
			console.log(req.body);
			handler.emit(req.body.type);
			res.sendStatus(200);
		} else {
			res.sendStatus(400);
		}
	});
};
