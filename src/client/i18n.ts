import Vue from 'vue';
import VueI18n from 'vue-i18n';
import { lang, locale } from './config';

Vue.use(VueI18n);

export default new VueI18n({
	locale: lang,
	messages: {
		[lang]: locale
	}
});
