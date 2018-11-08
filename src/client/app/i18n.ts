import VueI18n from 'vue-i18n';
import { lang, locale } from './config';

export default function(scope: string) {
	return new VueI18n({
		locale: lang,
		messages: {
			[lang]: locale[scope]
		}
	});
}
