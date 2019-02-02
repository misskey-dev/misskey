import limiter from './limiter';
import { IUser } from '../../models/user';
import { IApp } from '../../models/app';
import endpoints from './endpoints';

export default async (endpoint: string, user: IUser, app: IApp, data: any, file?: any) => {
	const isSecure = user != null && app == null;

	const ep = endpoints.find(e => e.name === endpoint);

	if (ep == null) {
		throw 'ENDPOINT_NOT_FOUND';
	}

	if (ep.meta.secure && !isSecure) {
		throw 'ACCESS_DENIED';
	}

	if (ep.meta.requireCredential && user == null) {
		throw 'CREDENTIAL_REQUIRED';
	}

	if (ep.meta.requireCredential && user.isSuspended) {
		throw 'YOUR_ACCOUNT_HAS_BEEN_SUSPENDED';
	}

	if (ep.meta.requireAdmin && !user.isAdmin) {
		throw 'YOU_ARE_NOT_ADMIN';
	}

	if (ep.meta.requireModerator && !user.isAdmin && !user.isModerator) {
		throw 'YOU_ARE_NOT_MODERATOR';
	}

	if (app && ep.meta.kind && !app.permission.some(p => p === ep.meta.kind)) {
		throw 'PERMISSION_DENIED';
	}

	if (ep.meta.requireCredential && ep.meta.limit) {
		try {
			await limiter(ep, user); // Rate limit
		} catch (e) {
			// drop request if limit exceeded
			throw 'RATE_LIMIT_EXCEEDED';
		}
	}

	let res;

	// API invoking
	try {
		res = await ep.exec(data, user, app, file);
	} catch (e) {
		if (e && e.name == 'INVALID_PARAM') {
			throw {
				code: e.name,
				param: e.param,
				reason: e.message
			};
		} else {
			throw e;
		}
	}

	return res;
};
