import { markRaw } from 'vue';
import type { Locale } from '../../../locales';
import { locale } from '@/config';
import { I18n } from '@/scripts/i18n';

export const i18n = markRaw(new I18n<Locale>(locale));

export function updateI18n(newLocale) {
	i18n.ts = newLocale;
}
