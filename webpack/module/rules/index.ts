import i18n from './i18n';
import themeColor from './theme-color';
import tag from './tag';
import stylus from './stylus';
import typescript from './typescript';

export default (lang, locale) => [
	i18n(lang, locale),
	themeColor(),
	tag(),
	stylus(),
	typescript()
];
