import * as https from 'https';
import { sign } from 'http-signature';
import * as crypto from 'crypto';
import * as cache from 'lookup-dns-cache';

import config from '../../config';
import { ILocalUser } from '../../models/entities/user';
import { publishApLogStream } from '../../services/stream';
import { apLogger } from './logger';
import { UserKeypairs, Instances } from '../../models';
import { fetchMeta } from '../../misc/fetch-meta';
import { toPuny } from '../../misc/convert-host';
import { ensure } from '../../prelude/ensure';
import * as httpsProxyAgent from 'https-proxy-agent';

export const logger = apLogger.createSubLogger('deliver');

const agent = config.proxy
	? new httpsProxyAgent(config.proxy)
	: new https.Agent({
			lookup: cache.lookup,
		});

export default async (user: ILocalUser, url: string, object: any) => {
	const timeout = 10 * 1000;

	const { protocol, host, hostname, port, pathname, search } = new URL(url);

	// ブロックしてたら中断
	const meta = await fetchMeta();
	if (meta.blockedHosts.includes(toPuny(host))) {
		logger.info(`skip (blocked) ${url}`);
		return;
	}

	// closedなら中断
	const closedHosts = await Instances.find({
		where: {
			isMarkedAsClosed: true
		},
		cache: 60 * 1000
	});
	if (closedHosts.map(x => x.host).includes(toPuny(host))) {
		logger.info(`skip (closed) ${url}`);
		return;
	}

	logger.info(`--> ${url}`);

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
				logger.warn(`${url} --> ${res.statusCode}`);
				reject(res);
			} else {
				logger.succ(`${url} --> ${res.statusCode}`);
				resolve();
			}
		});

		sign(req, {
			authorizationHeaderName: 'Signature',
			key: keypair.privateKey,
			keyId: `${config.url}/users/${user.id}/publickey`,
			headers: ['date', 'host', 'digest']
		});

		// Signature: Signature ... => Signature: ...
		let sig = req.getHeader('Signature')!.toString();
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
