import { request } from 'https';
import { sign } from 'http-signature';
import { URL } from 'url';
import * as debug from 'debug';

import config from '../config';
import { ILocalUser } from '../models/user';

const log = debug('misskey:activitypub:deliver');

export default (user: ILocalUser, url: string, object) => new Promise((resolve, reject) => {
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
		key: user.keypair,
		keyId: `acct:${user.username}@${config.host}`
	});

	req.end(JSON.stringify(object));
});
