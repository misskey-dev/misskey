import * as express from 'express';
import * as cookie from 'cookie';
import * as uuid from 'uuid';
// import * as Twitter from 'twitter';
// const Twitter = require('twitter');
import autwh from 'autwh';
import redis from '../../db/redis';
import User from '../models/user';
import serialize from '../serializers/user';
import event from '../event';
import config from '../../conf';
import signin from '../common/signin';

module.exports = (app: express.Application) => {
	app.get('/disconnect/twitter', async (req, res): Promise<any> => {
		if (res.locals.user == null) return res.send('plz signin');
		const user = await User.findOneAndUpdate({
			token: res.locals.user
		}, {
				$set: {
					twitter: null
				}
			});

		res.send(`Twitterの連携を解除しました :v:`);

		// Publish i updated event
		event(user._id, 'i_updated', await serialize(user, user, {
			detail: true,
			includeSecrets: true
		}));
	});

	if (config.twitter == null) {
		app.get('/connect/twitter', (req, res) => {
			res.send('現在Twitterへ接続できません (このインスタンスではTwitterはサポートされていません)');
		});

		app.get('/signin/twitter', (req, res) => {
			res.send('現在Twitterへ接続できません (このインスタンスではTwitterはサポートされていません)');
		});

		return;
	}

	const twAuth = autwh({
		consumerKey: config.twitter.consumer_key,
		consumerSecret: config.twitter.consumer_secret,
		callbackUrl: `${config.api_url}/tw/cb`
	});

	app.get('/connect/twitter', async (req, res): Promise<any> => {
		if (res.locals.user == null) return res.send('plz signin');
		const ctx = await twAuth.begin();
		redis.set(res.locals.user, JSON.stringify(ctx));
		res.redirect(ctx.url);
	});

	app.get('/signin/twitter', async (req, res): Promise<any> => {
		const ctx = await twAuth.begin();

		const sessid = uuid();

		redis.set(sessid, JSON.stringify(ctx));

		const expires = 1000 * 60 * 60; // 1h
		res.cookie('signin_with_twitter_session_id', sessid, {
			path: '/',
			domain: `.${config.host}`,
			secure: config.url.substr(0, 5) === 'https',
			httpOnly: true,
			expires: new Date(Date.now() + expires),
			maxAge: expires
		});

		res.redirect(ctx.url);
	});

	app.get('/tw/cb', (req, res): any => {
		if (res.locals.user == null) {
			// req.headers['cookie'] は常に string ですが、型定義の都合上
			// string | string[] になっているので string を明示しています
			const cookies = cookie.parse((req.headers['cookie'] as string || ''));

			const sessid = cookies['signin_with_twitter_session_id'];

			if (sessid == undefined) {
				res.status(400).send('invalid session');
			}

			redis.get(sessid, async (_, ctx) => {
				const result = await twAuth.done(JSON.parse(ctx), req.query.oauth_verifier);

				const user = await User.findOne({
					'twitter.user_id': result.userId
				});

				if (user == null) {
					res.status(404).send(`@${result.screenName}と連携しているMisskeyアカウントはありませんでした...`);
				}

				signin(res, user, true);
			});
		} else {
			redis.get(res.locals.user, async (_, ctx) => {
				const result = await twAuth.done(JSON.parse(ctx), req.query.oauth_verifier);

				const user = await User.findOneAndUpdate({
					token: res.locals.user
				}, {
					$set: {
						twitter: {
							access_token: result.accessToken,
							access_token_secret: result.accessTokenSecret,
							user_id: result.userId,
							screen_name: result.screenName
						}
					}
				});

				res.send(`Twitter: @${result.screenName} を、Misskey: @${user.username} に接続しました！`);

				// Publish i updated event
				event(user._id, 'i_updated', await serialize(user, user, {
					detail: true,
					includeSecrets: true
				}));
			});
		}
	});
};
