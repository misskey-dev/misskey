/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { url as local } from '@@/js/config.js';
import { instance } from '@/instance.js';
import { prefer } from '@/preferences.js';
import * as os from '@/os.js';
import MkUrlWarningDialog from '@/components/MkUrlWarningDialog.vue';

const extractDomain = /^(https?:\/\/|\/\/)?([^@/\s]+@)?(www\.)?([^:/\s]+)/i;
const isRegExp = /^\/(.+)\/(.*)$/;

export async function warningExternalWebsite(ev: MouseEvent, url: string) {
	const domain = extractDomain.exec(url)?.[4];
	const self = !domain || url.startsWith(local);
	const isTrustedByInstance = self || instance.trustedLinkUrlPatterns.some(expression => {
		const r = isRegExp.exec(expression);
		if (r) {
			return new RegExp(r[1], r[2]).test(url);
		} else if (expression.includes(' ')) return expression.split(' ').every(keyword => url.includes(keyword));
		else return domain.endsWith(expression);
	});
	const isTrustedByUser = prefer.s.trustedDomains.includes(domain);

	if (!self && !isTrustedByInstance && !isTrustedByUser) {
		ev.preventDefault();
		ev.stopPropagation();

		const confirm = await new Promise<{ canceled: boolean }>(resolve => {
			const { dispose } = os.popup(MkUrlWarningDialog, {
				url,
			}, {
				done: result => {
					resolve(result ? result : { canceled: true });
				},
				closed: () => {
					dispose();
				},
			});
		});

		if (confirm.canceled) return false;

		window.open(url, '_blank', 'noopener');
	}

	return true;
}
