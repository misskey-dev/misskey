import * as crypto from 'crypto';
import * as express from 'express';
import * as proxyAddr from 'proxy-addr';
import Xev from 'xev';

const ev = new Xev();

export default function(req: express.Request) {
	const ip = proxyAddr(req, () => true);

	const md5 = crypto.createHash('md5');
	md5.update(ip);
	const hashedIp = md5.digest('hex').substr(0, 3);

	ev.emit('request', {
		ip: hashedIp,
		method: req.method,
		hostname: req.hostname,
		path: req.originalUrl
	});
}
