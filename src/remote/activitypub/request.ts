import { request } from 'https';
const { sign } = require('http-signature');
import { URL } from 'url';
import * as debug from 'debug';

import config from '../../config';
import { ILocalUser } from '../../models/user';

const log = debug('misskey:activitypub:deliver');

export default (user: ILocalUser, url: string, object: any) => new Promise((resolve, reject) => {
	log(`--> ${url}`);

	const { protocol, hostname, port, pathname, search } = new URL(url);

	const req = request({
		protocol,
		hostname,
		port,
		method: 'POST',
		path: pathname + search,
		headers: {
			'Content-Type': 'application/activity+json'
		}
	}, res => {
		log(`${url} --> ${res.statusCode}`);

		if (res.statusCode >= 400) {
			reject();
		} else {
			resolve();
		}
	});

	sign(req, {
		authorizationHeaderName: 'Signature',
		key: user.keypair,
		keyId: `acct:${user.username}@${config.host}`
	});

	// Signature: Signature ... => Signature: ...
	let sig = req.getHeader('Signature').toString();
	sig = sig.replace(/^Signature /, '');
	req.setHeader('Signature', sig);

	req.end(JSON.stringify(object));
});
