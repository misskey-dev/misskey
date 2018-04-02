import * as express from 'express';
import * as cookie from 'cookie';
import * as uuid from 'uuid';
// import * as Twitter from 'twitter';
// const Twitter = require('twitter');
import autwh from 'autwh';
import redis from '../../../db/redis';
import User, { pack } from '../../../models/user';
import event from '../../../event';
import config from '../../../conf';
import signin from '../common/signin';

module.exports = (app: express.Application) => {
	function getUserToken(req: express.Request) {
		// req.headers['cookie'] は常に string ですが、型定義の都合上
		// string | string[] になっているので string を明示しています
		return ((req.headers['cookie'] as string || '').match(/i=(!\w+)/) || [null, null])[1];
	}

	function compareOrigin(req: express.Request) {
		function normalizeUrl(url: string) {
			return url[url.length - 1] === '/' ? url.substr(0, url.length - 1) : url;
		}

		// req.headers['referer'] は常に string ですが、型定義の都合上
		// string | string[] になっているので string を明示しています
		const referer = req.headers['referer'] as string;

		return (normalizeUrl(referer) == normalizeUrl(config.url));
	}

	app.get('/disconnect/twitter', async (req, res): Promise<any> => {
		if (!compareOrigin(req)) {
			res.status(400).send('invalid origin');
			return;
		}

		const userToken = getUserToken(req);
		if (userToken == null) return res.send('plz signin');

		const user = await User.findOneAndUpdate({
			host: null,
			'account.token': userToken
		}, {
			$set: {
				'account.twitter': null
			}
		});

		res.send(`Twitterの連携を解除しました :v:`);

		// Publish i updated event
		event(user._id, 'i_updated', await pack(user, user, {
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
		if (!compareOrigin(req)) {
			res.status(400).send('invalid origin');
			return;
		}

		const userToken = getUserToken(req);
		if (userToken == null) return res.send('plz signin');

		const ctx = await twAuth.begin();
		redis.set(userToken, JSON.stringify(ctx));
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
		const userToken = getUserToken(req);

		if (userToken == null) {
			// req.headers['cookie'] は常に string ですが、型定義の都合上
			// string | string[] になっているので string を明示しています
			const cookies = cookie.parse((req.headers['cookie'] as string || ''));

			const sessid = cookies['signin_with_twitter_session_id'];

			if (sessid == undefined) {
				res.status(400).send('invalid session');
				return;
			}

			redis.get(sessid, async (_, ctx) => {
				const result = await twAuth.done(JSON.parse(ctx), req.query.oauth_verifier);

				const user = await User.findOne({
					host: null,
					'account.twitter.userId': result.userId
				});

				if (user == null) {
					res.status(404).send(`@${result.screenName}と連携しているMisskeyアカウントはありませんでした...`);
					return;
				}

				signin(res, user, true);
			});
		} else {
			const verifier = req.query.oauth_verifier;

			if (verifier == null) {
				res.status(400).send('invalid session');
				return;
			}

			redis.get(userToken, async (_, ctx) => {
				const result = await twAuth.done(JSON.parse(ctx), verifier);

				const user = await User.findOneAndUpdate({
					host: null,
					'account.token': userToken
				}, {
					$set: {
						'account.twitter': {
							accessToken: result.accessToken,
							accessTokenSecret: result.accessTokenSecret,
							userId: result.userId,
							screenName: result.screenName
						}
					}
				});

				res.send(`Twitter: @${result.screenName} を、Misskey: @${user.username} に接続しました！`);

				// Publish i updated event
				event(user._id, 'i_updated', await pack(user, user, {
					detail: true,
					includeSecrets: true
				}));
			});
		}
	});
};
