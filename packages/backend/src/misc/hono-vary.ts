/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Context as HonoContext } from 'hono';

export function vary(c: HonoContext, field: string) {
	const varyHeader = c.res.headers.get('Vary');
	if (varyHeader != null) {
		const fields = varyHeader.split(',').map((f) => f.trim());
		if (!fields.includes(field)) {
			c.res.headers.set('Vary', `${varyHeader}, ${field}`);
		}
	} else {
		c.res.headers.set('Vary', field);
	}
}
