import { performance } from 'perf_hooks';
import limiter from './limiter';
import { User } from '../../models/entities/user';
import endpoints from './endpoints';
import { ApiError } from './error';
import { apiLogger } from './logger';
import { AccessToken } from '../../models/entities/access-token';

const accessDenied = {
	message: 'Access denied.',
	code: 'ACCESS_DENIED',
	id: '56f35758-7dd5-468b-8439-5d6fb8ec9b8e'
};

export default async (endpoint: string, user: User | null | undefined, token: AccessToken | null | undefined, data: any, file?: any) => {
	const isSecure = user != null && token == null;

	const ep = endpoints.find(e => e.name === endpoint);

	if (ep == null) {
		throw new ApiError({
			message: 'No such endpoint.',
			code: 'NO_SUCH_ENDPOINT',
			id: 'f8080b67-5f9c-4eb7-8c18-7f1eeae8f709',
			httpStatusCode: 404
		});
	}

	if (ep.meta.secure && !isSecure) {
		throw new ApiError(accessDenied);
	}

	if (ep.meta.requireCredential && user == null) {
		throw new ApiError({
			message: 'Credential required.',
			code: 'CREDENTIAL_REQUIRED',
			id: '1384574d-a912-4b81-8601-c7b1c4085df1',
			httpStatusCode: 401
		});
	}

	if (ep.meta.requireCredential && user!.isSuspended) {
		throw new ApiError(accessDenied, { reason: 'Your account has been suspended.' });
	}

	if (ep.meta.requireAdmin && !user!.isAdmin) {
		throw new ApiError(accessDenied, { reason: 'You are not the admin.' });
	}

	if (ep.meta.requireModerator && !user!.isAdmin && !user!.isModerator) {
		throw new ApiError(accessDenied, { reason: 'You are not a moderator.' });
	}

	if (token && ep.meta.kind && !token.permission.some(p => p === ep.meta.kind)) {
		throw new ApiError({
			message: 'Your app does not have the necessary permissions to use this endpoint.',
			code: 'PERMISSION_DENIED',
			id: '1370e5b7-d4eb-4566-bb1d-7748ee6a1838',
		});
	}

	if (ep.meta.requireCredential && ep.meta.limit && !user!.isAdmin && !user!.isModerator) {
		// Rate limit
		await limiter(ep, user!).catch(e => {
			throw new ApiError({
				message: 'Rate limit exceeded. Please try again later.',
				code: 'RATE_LIMIT_EXCEEDED',
				id: 'd5826d14-3982-4d2e-8011-b9e9f02499ef',
				httpStatusCode: 429
			});
		});
	}

	// API invoking
	const before = performance.now();
	return await ep.exec(data, user, token, file).catch((e: Error) => {
		if (e instanceof ApiError) {
			throw e;
		} else {
			apiLogger.error(`Internal error occurred in ${ep.name}`, {
				ep: ep.name,
				ps: data,
				e: {
					message: e?.message,
					code: e?.name,
					stack: e?.stack
				}
			});
			throw new ApiError(null, {
				e: {
					message: e?.message,
					code: e?.name,
					stack: e?.stack
				}
			});
		}
	}).finally(() => {
		const after = performance.now();
		const time = after - before;
		if (time > 1000) {
			apiLogger.warn(`SLOW API CALL DETECTED: ${ep.name} (${time}ms)`);
		}
	});
};
