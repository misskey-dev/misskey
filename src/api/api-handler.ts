import * as express from 'express';

import { Endpoint } from './endpoints';
import authenticate from './authenticate';
import { IAuthContext } from './authenticate';
import _reply from './reply';
import limitter from './limitter';

export default async (endpoint: Endpoint, req: express.Request, res: express.Response) => {
	const reply = _reply.bind(null, res);
	let ctx: IAuthContext;

	// Authentication
	try {
		ctx = await authenticate(req);
	} catch (e) {
		return reply(403, 'AUTHENTICATION_FAILED');
	}

	if (endpoint.secure && !ctx.isSecure) {
		return reply(403, 'ACCESS_DENIED');
	}

	if (endpoint.withCredential && ctx.user == null) {
		return reply(401, 'PLZ_SIGNIN');
	}

	if (ctx.app && endpoint.kind) {
		if (!ctx.app.permission.some(p => p === endpoint.kind)) {
			return reply(403, 'ACCESS_DENIED');
		}
	}

	if (endpoint.withCredential && endpoint.limit) {
		try {
			await limitter(endpoint, ctx); // Rate limit
		} catch (e) {
			// drop request if limit exceeded
			return reply(429);
		}
	}

	let exec = require(`${__dirname}/endpoints/${endpoint.name}`);

	if (endpoint.withFile) {
		exec = exec.bind(null, req.file);
	}

	// API invoking
	try {
		const res = await exec(req.body, ctx.user, ctx.app, ctx.isSecure);
		reply(res);
	} catch (e) {
		reply(400, e);
	}
};
