import { lang, locale } from './config';

export default function(scope?: string) {
	const texts = scope ? locale[scope] || {} : {};
	texts['@common'] = locale['common'];
	return {
		sync: false,
		locale: lang,
		messages: {
			[lang]: texts
		}
	};
}
