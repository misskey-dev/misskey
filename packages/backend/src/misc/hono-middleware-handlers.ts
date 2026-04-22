/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createMiddleware } from 'hono/factory';

export const handleRequestRedirectToOmitSearch = createMiddleware(async (c, next) => {
	const index = c.req.url.indexOf('?');
	if (~index) {
		return c.redirect(c.req.url.slice(0, index), 301);
	}
	await next();
	return;
});
