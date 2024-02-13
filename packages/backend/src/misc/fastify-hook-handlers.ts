import type { onRequestHookHandler } from 'fastify';

export const handleRequestRedirectToOmitSearch: onRequestHookHandler = (request, reply, done) => {
	const index = request.url.indexOf('?');
	if (~index) {
		reply.redirect(301, request.url.slice(0, index));
	}
	done();
};
