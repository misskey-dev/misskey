/**
 * Languages Loader
 */

import * as fs from 'fs';
import * as yaml from 'js-yaml';

export type LangKey = 'de' | 'en' | 'fr' | 'ja' | 'pl';
export type LocaleObject = { [key: string]: any };

const loadLang = (lang: LangKey) => yaml.safeLoad(
	fs.readFileSync(`./locales/${lang}.yml`, 'utf-8')) as LocaleObject;

const native = loadLang('ja');

const langs: { [key: string]: LocaleObject } = {
	'de': loadLang('de'),
	'en': loadLang('en'),
	'fr': loadLang('fr'),
	'ja': native,
	'pl': loadLang('pl'),
	'es': loadLang('es')
};

Object.entries(langs).map(([, locale]) => {
	// Extend native language (Japanese)
	locale = Object.assign({}, native, locale);
});

export function isAvailableLanguage(lang: string): lang is LangKey {
	return lang in langs;
}

export default langs;
