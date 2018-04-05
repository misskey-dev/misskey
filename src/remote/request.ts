import { request } from 'https';
import { sign } from 'http-signature';
import { URL } from 'url';
import * as debug from 'debug';

import config from '../config';

const log = debug('misskey:activitypub:deliver');

export default ({ account, username }, url, object) => new Promise((resolve, reject) => {
	log(`--> ${url}`);

	const { protocol, hostname, port, pathname, search } = new URL(url);

	const req = request({
		protocol,
		hostname,
		port,
		method: 'POST',
		path: pathname + search,
	}, res => {
		res.on('end', () => {
			log(`${url} --> ${res.statusCode}`);

			if (res.statusCode >= 200 && res.statusCode < 300) {
				resolve();
			} else {
				reject(res);
			}
		});

		res.on('data', () => {});
		res.on('error', reject);
	});

	sign(req, {
		authorizationHeaderName: 'Signature',
		key: account.keypair,
		keyId: `acct:${username}@${config.host}`
	});

	req.end(JSON.stringify(object));
});
