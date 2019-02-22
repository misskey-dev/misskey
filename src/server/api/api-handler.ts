import * as Koa from 'koa';

import { IEndpoint } from './endpoints';
import authenticate from './authenticate';
import call from './call';
import { IUser } from '../../models/user';
import { IApp } from '../../models/app';
import { ApiError } from './error';

export default async (endpoint: IEndpoint, ctx: Koa.BaseContext) => {
	const body = ctx.is('multipart/form-data') ? (ctx.req as any).body : ctx.request.body;

	const reply = (x?: any, y?: ApiError) => {
		if (x == null) {
			ctx.status = 204;
		} else if (typeof x === 'number') {
			ctx.status = x;
			ctx.body = y;
		} else {
			ctx.body = x;
		}
	};

	let user: IUser;
	let app: IApp;

	// Authentication
	try {
		[user, app] = await authenticate(body['i']);
	} catch (e) {
		reply(403, new ApiError({
			message: 'Authentication failed. Please ensure your token is correct.',
			code: 'AUTHENTICATION_FAILED',
			id: 'b0a7f5f8-dc2f-4171-b91f-de88ad238e14'
		}));
		return;
	}

	let res;

	// API invoking
	try {
		res = await call(endpoint.name, user, app, body, (ctx.req as any).file);
	} catch (e) {
		if (e.kind == 'client') {
			reply(400, e);
		} else {
			reply(500, e);
		}
		return;
	}

	reply(res);
};
