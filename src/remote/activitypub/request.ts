import { request } from 'https';
import { sign } from 'http-signature';
import { URL } from 'url';
import * as crypto from 'crypto';
import { lookup, IRunOptions } from 'lookup-dns-cache';
import * as promiseAny from 'promise-any';

import config from '../../config';
import { ILocalUser } from '../../models/user';
import { publishApLogStream } from '../../services/stream';
import { apLogger } from './logger';
import Instance from '../../models/instance';
import { toDbHost } from '../../misc/convert-host';

export const logger = apLogger.createSubLogger('deliver');

export default async (user: ILocalUser, url: string, object: any) => {
	logger.info(`--> ${url}`);

	const timeout = 10 * 1000;

	const { protocol, host, hostname, port, pathname, search } = new URL(url);

	// ブロックしてたら中断
	// TODO: いちいちデータベースにアクセスするのはコスト高そうなのでどっかにキャッシュしておく
	const instance = await Instance.findOne({ host: toDbHost(host) });
	if (instance && instance.isBlocked) return;

	const data = JSON.stringify(object);

	const sha256 = crypto.createHash('sha256');
	sha256.update(data);
	const hash = sha256.digest('base64');

	const addr = await resolveAddr(hostname);
	if (!addr) return;

	await new  Promise((resolve, reject) => {
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
				'User-Agent': config.userAgent,
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
	});

	//#region Log
	publishApLogStream({
		direction: 'out',
		activity: object.type,
		host: null,
		actor: user.username
	});
	//#endregion
};

/**
 * Resolve host (with cached, asynchrony)
 */
async function resolveAddr(domain: string) {
	const af = config.outgoingAddressFamily || 'ipv4';
	const useV4 = af == 'ipv4' || af == 'dual';
	const useV6 = af == 'ipv6' || af == 'dual';

	const promises = [];

	if (!useV4 && !useV6) throw 'No usable address family available';
	if (useV4) promises.push(resolveAddrInner(domain, { family: 4 }));
	if (useV6) promises.push(resolveAddrInner(domain, { family: 6 }));

	// v4/v6で先に取得できた方を採用する
	return await promiseAny(promises);
}

function resolveAddrInner(domain: string, options: IRunOptions = {}): Promise<string> {
	return new Promise((res, rej) => {
		lookup(domain, options, (error: any, address: string | string[]) => {
			if (error) return rej(error);
			return res(Array.isArray(address) ? address[0] : address);
		});
	});
}
