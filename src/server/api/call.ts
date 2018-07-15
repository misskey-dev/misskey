import * as path from 'path';
import * as glob from 'glob';

import Endpoint from './endpoint';
import limitter from './limitter';
import { IUser } from '../../models/user';
import { IApp } from '../../models/app';

const files = glob.sync('**/*.js', {
	cwd: path.resolve(__dirname + '/endpoints/')
});

const endpoints: Array<{
	exec: any,
	meta: Endpoint
}> = files.map(f => {
	const ep = require('./endpoints/' + f);

	ep.meta = ep.meta || {};
	ep.meta.name = f.replace('.js', '');

	return {
		exec: ep.default,
		meta: ep.meta
	};
});

export default (endpoint: string | Endpoint, user: IUser, app: IApp, data: any, file?: any) => new Promise<any>(async (ok, rej) => {
	const isSecure = user != null && app == null;

	const epName = typeof endpoint === 'string' ? endpoint : endpoint.name;
	const ep = endpoints.find(e => e.meta.name === epName);

	if (ep.meta.secure && !isSecure) {
		return rej('ACCESS_DENIED');
	}

	if (ep.meta.requireCredential && user == null) {
		return rej('SIGNIN_REQUIRED');
	}

	if (ep.meta.requireCredential && user.isSuspended) {
		return rej('YOUR_ACCOUNT_HAS_BEEN_SUSPENDED');
	}

	if (app && ep.meta.kind) {
		if (!app.permission.some(p => p === ep.meta.kind)) {
			return rej('PERMISSION_DENIED');
		}
	}

	if (ep.meta.requireCredential && ep.meta.limit) {
		try {
			await limitter(ep.meta, user); // Rate limit
		} catch (e) {
			// drop request if limit exceeded
			return rej('RATE_LIMIT_EXCEEDED');
		}
	}

	let exec = ep.exec;

	if (ep.meta.withFile && file) {
		exec = exec.bind(null, file);
	}

	let res;

	// API invoking
	try {
		res = await exec(data, user, app);
	} catch (e) {
		rej(e);
		return;
	}

	ok(res);
});
