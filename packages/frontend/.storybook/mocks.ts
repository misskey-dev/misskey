/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { type SharedOptions, http, HttpResponse } from 'msw';

export const onUnhandledRequest = ((req, print) => {
	if (req.url.hostname !== 'localhost' || /^\/(?:client-assets\/|fluent-emojis?\/|iframe.html$|node_modules\/|src\/|sb-|static-assets\/|vite\/)/.test(req.url.pathname)) {
		return
	}
	print.warning()
}) satisfies SharedOptions['onUnhandledRequest'];

export const commonHandlers = [
	http.get('/fluent-emoji/:codepoints.png', async ({ params }) => {
		const { codepoints } = params;
		const value = await fetch(`https://raw.githubusercontent.com/misskey-dev/emojis/main/dist/${codepoints}.png`).then((response) => response.blob());
		return new HttpResponse(value, {
			headers: {
				'Content-Type': 'image/png',
			},
		});
	}),
	http.get('/fluent-emojis/:codepoints.png', async ({ params }) => {
		const { codepoints } = params;
		const value = await fetch(`https://raw.githubusercontent.com/misskey-dev/emojis/main/dist/${codepoints}.png`).then((response) => response.blob());
		return new HttpResponse(value, {
			headers: {
				'Content-Type': 'image/png',
			},
		});
	}),
	http.get('/twemoji/:codepoints.svg', async ({ params }) => {
		const { codepoints } = params;
		const value = await fetch(`https://unpkg.com/@discordapp/twemoji@15.0.2/dist/svg/${codepoints}.svg`).then((response) => response.blob());
		return new HttpResponse(value, {
			headers: {
				'Content-Type': 'image/svg+xml',
			},
		});
	}),
];
