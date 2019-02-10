import { request } from 'https';
import { sign } from 'http-signature';
import { URL } from 'url';
import * as crypto from 'crypto';
import { lookup, IRunOptions } from 'lookup-dns-cache';
import * as promiseAny from 'promise-any';
import { toUnicode } from 'punycode';

import config from '../../config';
import { ILocalUser } from '../../models/user';
import { publishApLogStream } from '../../services/stream';
import { apLogger } from './logger';
import Instance from '../../models/instance';

export const logger = apLogger.createSubLogger('deliver');

export default (user: ILocalUser, url: string, object: any) => new Promise(async (resolve, reject) => {
	logger.info(`--> ${url}`);

	const timeout = 10 * 1000;

	const { protocol, host, hostname, port, pathname, search } = new URL(url);

	// ブロックしてたら中断
	// TODO: いちいちデータベースにアクセスするのはコスト高そうなのでどっかにキャッシュしておく
	const instance = await Instance.findOne({ host: toUnicode(host) });
	if (instance && instance.isBlocked) return;

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
		if (res.statusCode >= 400) {
			logger.warn(`${url} --> ${res.statusCode}`);
			reject(res);
		} else {
			logger.succ(`${url} --> ${res.statusCode}`);
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
		resolveAddrInner(domain, { family: 4 }),
		resolveAddrInner(domain, { family: 6 })
	]);
}

function resolveAddrInner(domain: string, options: IRunOptions = {}): Promise<string> {
	return new Promise((res, rej) => {
		lookup(domain, options, (error: any, address: string | string[]) => {
			if (error) return rej(error);
			return res(Array.isArray(address) ? address[0] : address);
		});
	});
}
