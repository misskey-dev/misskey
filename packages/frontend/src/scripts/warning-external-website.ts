import { url as local } from '@/config.js';
import { instance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';

const extractDomain = /^(https?:\/\/|\/\/)?([^@/\s]+@)?(www\.)?([^:/\s]+)/i;
const isRegExp = /^\/(.+)\/(.*)$/;

export async function warningExternalWebsite(ev: MouseEvent, url: string) {
	const domain = extractDomain.exec(url)?.[4];
	const self = !domain || url.startsWith(local);
	const isWellKnownWebsite = self || instance.wellKnownWebsites.some(expression => {
		const r = isRegExp.exec(expression);
		if (r) {
			return new RegExp(r[1], r[2]).test(url);
		} else if (expression.includes(' ')) return expression.split(' ').every(keyword => url.includes(keyword));
		else return domain.endsWith(expression);
	});

	if (!self && !isWellKnownWebsite) {
		ev.preventDefault();
		ev.stopPropagation();

		const confirm = await os.confirm({
			type: 'warning',
			title: i18n.ts.warningRedirectingExternalWebsiteTitle,
			text: i18n.tsx.warningRedirectingExternalWebsiteDescription({ url: `\`\`\`\n${url}\n\`\`\`` }),
		});

		if (confirm.canceled) return false;

		window.open(url, '_blank', 'noopener');
	}

	return true;
}
