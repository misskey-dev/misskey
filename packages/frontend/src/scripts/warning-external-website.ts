/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { url as local } from '@/config.js';
import { instance } from '@/instance.js';
import * as os from '@/os.js';
import MkUrlWarningDialog from '@/components/MkUrlWarningDialog.vue';

const isRegExp = /^\/(.+)\/(.*)$/;

export async function warningExternalWebsite(ev: MouseEvent, url: string) {
	const self = url.startsWith(local);
	const isWellKnownWebsite = self || instance.wellKnownWebsites.some(expression => {
		const r = isRegExp.exec(expression);
		if (r) {
			return new RegExp(r[1], r[2]).test(url);
		} else return expression.split(' ').every(keyword => url.includes(keyword));
	});

	if (!self && !isWellKnownWebsite) {
		ev.preventDefault();
		ev.stopPropagation();

		const confirm = await new Promise<{ canceled: boolean }>(resolve => {
			os.popup(MkUrlWarningDialog, {
				url,
			}, {
				done: result => {
					resolve(result ? result : { canceled: true });
				},
			}, 'closed');
		});

		if (confirm.canceled) return false;

		window.open(url, '_blank', 'noopener');
	}

	return true;
}
