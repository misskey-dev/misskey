import * as express from 'express';
// import * as Twitter from 'twitter';
// const Twitter = require('twitter');
import autwh from 'autwh';
import redis from '../../db/redis';
import User from '../models/user';
import serialize from '../serializers/user';
import event from '../event';
import config from '../../conf';

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
			res.send('現在Twitterへ接続できません');
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

	app.get('/tw/cb', (req, res): any => {
		if (res.locals.user == null) return res.send('plz signin');
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
	});
};
