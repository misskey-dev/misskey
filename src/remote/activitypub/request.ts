import { request } from 'https';
const { sign } = require('http-signature');
import { URL } from 'url';
import * as debug from 'debug';
const crypto = require('crypto');

import config from '../../config';
import { ILocalUser } from '../../models/user';

const log = debug('misskey:activitypub:deliver');

export default (user: ILocalUser, url: string, object: any) => new Promise((resolve, reject) => {
	log(`--> ${url}`);

	const timeout = 10 * 1000;

	const { protocol, hostname, port, pathname, search } = new URL(url);

	const data = JSON.stringify(object);

	const sha256 = crypto.createHash('sha256');
	sha256.update(data);
	const hash = sha256.digest('base64');

	const req = request({
		protocol,
		hostname,
		port,
		method: 'POST',
		path: pathname + search,
		timeout,
		headers: {
			'User-Agent': config.user_agent,
			'Content-Type': 'application/activity+json',
			'Digest': `SHA-256=${hash}`
		}
	}, res => {
		log(`${url} --> ${res.statusCode}`);

		if (res.statusCode >= 400) {
			reject(res);
		} else {
			resolve();
		}
	});

	sign(req, {
		authorizationHeaderName: 'Signature',
		key: user.keypair,
		keyId: `${config.url}/users/${user._id}/publickey`,
		headers: ['date', 'host', 'digest']
	});

	// Signature: Signature ... => Signature: ...
	let sig = req.getHeader('Signature').toString();
	sig = sig.replace(/^Signature /, '');
	req.setHeader('Signature', sig);

	req.on('timeout', () => req.abort());

	req.on('error', e => {
		if (req.aborted) reject('timeout');
		reject(e);
	});

	req.end(data);
});
