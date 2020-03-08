import * as https from 'https';
import { sign } from 'http-signature';
import * as crypto from 'crypto';
import * as cache from 'lookup-dns-cache';

import config from '../../config';
import { ILocalUser } from '../../models/entities/user';
import { UserKeypairs } from '../../models';
import { ensure } from '../../prelude/ensure';
import { HttpsProxyAgent } from 'https-proxy-agent';

const agent = config.proxy
	? new HttpsProxyAgent(config.proxy)
	: new https.Agent({
			lookup: cache.lookup,
		});

export default async (user: ILocalUser, url: string, object: any) => {
	const timeout = 10 * 1000;

	const { protocol, hostname, port, pathname, search } = new URL(url);

	const data = JSON.stringify(object);

	const sha256 = crypto.createHash('sha256');
	sha256.update(data);
	const hash = sha256.digest('base64');

	const keypair = await UserKeypairs.findOne({
		userId: user.id
	}).then(ensure);

	await new Promise((resolve, reject) => {
		const req = https.request({
			agent,
			protocol,
			hostname,
			port,
			method: 'POST',
			path: pathname + search,
			timeout,
			headers: {
				'User-Agent': config.userAgent,
				'Content-Type': 'application/activity+json',
				'Digest': `SHA-256=${hash}`
			}
		}, res => {
			if (res.statusCode! >= 400) {
				reject(res);
			} else {
				resolve();
			}
		});

		sign(req, {
			authorizationHeaderName: 'Signature',
			key: keypair.privateKey,
			keyId: `${config.url}/users/${user.id}#main-key`,
			headers: ['date', 'host', 'digest']
		});

		req.on('timeout', () => req.abort());

		req.on('error', e => {
			if (req.aborted) reject('timeout');
			reject(e);
		});

		req.end(data);
	});
};
