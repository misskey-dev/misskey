import { request } from 'https';
import { sign } from 'http-signature';
import { URL } from 'url';
import config from '../config';

export default ({ account, username }, url, object) => new Promise((resolve, reject) => {
	const { protocol, hostname, port, pathname, search } = new URL(url);

	const req = request({
		protocol,
		hostname,
		port,
		method: 'POST',
		path: pathname + search,
	}, res => {
		res.on('end', () => {
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
