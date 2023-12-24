/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { type SharedOptions, rest } from 'msw';

export const onUnhandledRequest = ((req, print) => {
	if (req.url.hostname !== 'localhost' || /^\/(?:client-assets\/|fluent-emojis?\/|iframe.html$|node_modules\/|src\/|sb-|static-assets\/|vite\/)/.test(req.url.pathname)) {
		return
	}
	print.warning()
}) satisfies SharedOptions['onUnhandledRequest'];

export const commonHandlers = [
	rest.get('/fluent-emoji/:codepoints.png', async (req, res, ctx) => {
		const { codepoints } = req.params;
		const value = await fetch(`https://raw.githubusercontent.com/misskey-dev/emojis/main/dist/${codepoints}.png`).then((response) => response.blob());
		return res(ctx.set('Content-Type', 'image/png'), ctx.body(value));
	}),
	rest.get('/fluent-emojis/:codepoints.png', async (req, res, ctx) => {
		const { codepoints } = req.params;
		const value = await fetch(`https://raw.githubusercontent.com/misskey-dev/emojis/main/dist/${codepoints}.png`).then((response) => response.blob());
		return res(ctx.set('Content-Type', 'image/png'), ctx.body(value));
	}),
	rest.get('/twemoji/:codepoints.svg', async (req, res, ctx) => {
		const { codepoints } = req.params;
		const value = await fetch(`https://unpkg.com/@discordapp/twemoji@15.0.2/dist/svg/${codepoints}.svg`).then((response) => response.blob());
		return res(ctx.set('Content-Type', 'image/svg+xml'), ctx.body(value));
	}),
];
