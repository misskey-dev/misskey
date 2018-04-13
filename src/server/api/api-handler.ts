import * as Koa from 'koa';

import { Endpoint } from './endpoints';
import authenticate from './authenticate';
import call from './call';
import { IUser } from '../../models/user';
import { IApp } from '../../models/app';

export default async (endpoint: Endpoint, ctx: Koa.Context) => {
	const body = ctx.is('multipart/form-data') ? (ctx.req as any).body : ctx.request.body;

	const reply = (x?: any, y?: any) => {
		if (x === undefined) {
			ctx.status = 204;
		} else if (typeof x === 'number') {
			ctx.status = x;
			ctx.body = {
				error: x === 500 ? 'INTERNAL_ERROR' : y
			};
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
		reply(403, 'AUTHENTICATION_FAILED');
		return;
	}

	let res;

	// API invoking
	try {
		res = await call(endpoint, user, app, body, (ctx.req as any).file);
	} catch (e) {
		reply(400, e);
		return;
	}

	reply(res);
};
