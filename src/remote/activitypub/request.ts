import { request } from 'https';
const { sign } = require('http-signature');
import { URL } from 'url';
import * as debug from 'debug';
import * as crypto from 'crypto';
const { lookup } = require('lookup-dns-cache');
const promiseAny = require('promise-any');

import config from '../../config';
import { ILocalUser } from '../../models/user';
import { publishApLogStream } from '../../stream';

const log = debug('misskey:activitypub:deliver');

export default (user: ILocalUser, url: string, object: any) => new Promise(async (resolve, reject) => {
	log(`--> ${url}`);

	const timeout = 10 * 1000;

	const { protocol, host, hostname, port, pathname, search } = new URL(url);

	const data = JSON.stringify(object);

	const sha256 = crypto.createHash('sha256');
	sha256.update(data);
	const hash = sha256.digest('base64');

	const addr = await resolveAddr(hostname).catch(e => reject(e));
	if (!addr) return;

	const req = request({
		protocol,
		hostname: addr,
		setHost: false,
		port,
		method: 'POST',
		path: pathname + search,
		timeout,
		headers: {
			'Host': host,
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

	//#region Log
	publishApLogStream({
		direction: 'out',
		activity: object.type,
		host: null,
		actor: user.username
	});
	//#endregion
});

/**
 * Resolve host (with cached, asynchrony)
 */
async function resolveAddr(domain: string) {
	// v4/v6で先に取得できた方を採用する
	return await promiseAny([
		resolveAddrInner(domain, { ipv6: false }),
		resolveAddrInner(domain, { ipv6: true  })
	]);
}

function resolveAddrInner(domain: string, options = { }): Promise<string> {
	return new Promise((res, rej) => {
		lookup(domain, options, (error: any, address: string) => {
			if (error) return rej(error);
			return res(address);
		});
	});
}
