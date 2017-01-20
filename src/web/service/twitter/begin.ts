import * as express from 'express';
//import * as Twitter from 'twitter';
import Twitter = require('twitter');

const client = new Twitter({
	consumer_key: process.env.TWITTER_CONSUMER_KEY,
	consumer_secret: process.env.TWITTER_CONSUMER_SECRET
});

module.exports = (req: express.Request, res: express.Response) => {
	client.get('oauth/request_token', (x, y, z) => {
		console.log(x);
		console.log(y);
		console.log(z);
	});
};
