import * as express from 'express';
//import * as Twitter from 'twitter';
const Twitter = require('twitter');
import config from '../../../conf';

module.exports = (req: express.Request, res: express.Response) => {
	if (config.twitter) {
		const client = new Twitter({
			consumer_key: config.twitter.consumer_key,
			consumer_secret: config.twitter.consumer_secret
		});

		client.post('oauth/request_token', {
			oauth_callback: config.url + '/tw/cb'
		}, (x, y, z) => {
			console.log(x);
			console.log(y);
			console.log(z);
		});
	}
};
