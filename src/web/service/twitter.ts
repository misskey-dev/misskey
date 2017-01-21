import * as express from 'express';
//import * as Twitter from 'twitter';
//const Twitter = require('twitter');
import autwh from 'autwh';
import redis from '../../db/redis';
import config from '../../conf';

module.exports = (app: express.Application) => {
	if (config.twitter == null) return;

	const twAuth = autwh({
		consumerKey: config.twitter.consumer_key,
		consumerSecret: config.twitter.consumer_secret,
		callbackUrl: config.url + '/tw/cb'
	});

	app.get('/twitter:connect', async (req, res): Promise<any> => {
		if (res.locals.user == null) return res.send('plz signin');
		const ctx = await twAuth.begin();
		redis.set(res.locals.user, JSON.stringify(ctx));
		res.redirect(ctx.url);
	});

	app.get('/twitter/callback', (req, res): any => {
		if (res.locals.user == null) return res.send('plz signin');
		redis.get(res.locals.user, async (_, ctx) => {
			const tokens = await twAuth.done(JSON.parse(ctx), req.query.oauth_verifier);
			console.log(tokens);
			res.send('Authorized!');
		})
	});
};
