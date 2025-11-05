/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { url as local } from '@@/js/config.js';
import { extractDomain } from '@@/js/url.js';
import { instance } from '@/instance.js';
import { store } from '@/store.js';
import * as os from '@/os.js';
import MkUrlWarningDialog from '@/components/MkUrlWarningDialog.vue';
import type { MkUrlWarningDialogDoneEvent } from '@/components/MkUrlWarningDialog.vue';

const isRegExp = /^\/(.+)\/(.*)$/;

export async function warningExternalWebsite(ev: MouseEvent, url: string) {
	const domain = extractDomain(url);
	const self = (domain == null || url.startsWith(local));

	const isTrustedByInstance = self || instance.trustedLinkUrlPatterns.some(expression => {
		const r = isRegExp.exec(expression);
		if (r) {
			return new RegExp(r[1], r[2]).test(url);
		} else if (expression.includes(' ')) {
			return expression.split(' ').every(keyword => url.includes(keyword));
		} else {
			return domain.endsWith(expression);
		}
	});

	const isTrustedByUser = domain != null && store.s.trustedDomains.includes(domain);

	if (!self && !isTrustedByInstance && !isTrustedByUser) {
		ev.preventDefault();
		ev.stopPropagation();

		const confirm = await new Promise<{ canceled: boolean }>(resolve => {
			const { dispose } = os.popup(MkUrlWarningDialog, {
				url,
			}, {
				done: (result: MkUrlWarningDialogDoneEvent) => {
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
