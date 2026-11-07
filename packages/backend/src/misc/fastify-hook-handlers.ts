/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { onRequestHookHandler } from 'fastify';

export const handleRequestRedirectToOmitSearch: onRequestHookHandler = (request, reply, done) => {
	const index = request.url.indexOf('?');
	if (~index) {
		reply.redirect(request.url.slice(0, index), 301);
	}
	done();
};
