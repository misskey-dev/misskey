import { lang, locale } from './config';

export default function(scope: string) {
	return {
		locale: lang,
		messages: {
			[lang]: locale[scope]
		}
	};
}
