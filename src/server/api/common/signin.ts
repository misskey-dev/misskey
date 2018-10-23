import * as Koa from 'koa';

import config from '../../../config';
import { ILocalUser } from '../../../models/user';

export default function(ctx: Koa.Context, user: ILocalUser, redirect = false) {
	const expires = 1000 * 60 * 60 * 24 * 365; // One Year
	ctx.cookies.set('i', user.token, {
		path: '/',
		domain: config.hostname,
		// SEE: https://github.com/koajs/koa/issues/974
		//secure: config.url.startsWith('https'),
		secure: false,
		httpOnly: false,
		expires: new Date(Date.now() + expires),
		maxAge: expires
	});

	if (redirect) {
		ctx.redirect(config.url);
	} else {
		ctx.status = 204;
	}
}
