/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createMiddleware } from 'hono/factory';

export const handleRequestRedirectToOmitSearch = createMiddleware(async (c, next) => {
	if (c.req.url.includes('?')) {
		return c.redirect(c.req.path, 301);
	}

	await next();
	return;
});
