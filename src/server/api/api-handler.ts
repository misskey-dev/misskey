import * as Koa from 'koa';

import { IEndpoint } from './endpoints';
import authenticate from './authenticate';
import call from './call';
import { ApiError } from './error';

export default (endpoint: IEndpoint, ctx: Koa.BaseContext) => new Promise((res) => {
	const body = ctx.is('multipart/form-data') ? (ctx.req as any).body : ctx.request.body;

	const reply = (x?: any, y?: ApiError) => {
		if (x == null) {
			ctx.status = 204;
		} else if (typeof x === 'number') {
			ctx.status = x;
			ctx.body = { error: y };
		} else {
			ctx.body = x;
		}
		res();
	};

	// Authentication
	authenticate(body['i']).then(([user, app]) => {
		// API invoking
		call(endpoint.name, user, app, body, (ctx.req as any).file).then(res => {
			reply(res);
		}).catch(e => {
			reply(e.httpStatusCode ? e.httpStatusCode :  e.kind == 'client' ? 400 : 500, e);
		});
	}).catch(() => {
		reply(403, new ApiError({
			message: 'Authentication failed. Please ensure your token is correct.',
			code: 'AUTHENTICATION_FAILED',
			id: 'b0a7f5f8-dc2f-4171-b91f-de88ad238e14'
		}));
	});
});
