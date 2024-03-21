import { url as local } from '@/config.js';
import { instance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';

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

		const confirm = await os.confirm({
			type: 'warning',
			title: i18n.ts.warningRedirectingExternalWebsiteTitle,
			text: i18n.tsx.warningRedirectingExternalWebsiteDescription({ url }),
		});

		if (confirm.canceled) return false;

		window.open(url, '_blank', 'noopener');
	}

	return true;
}
