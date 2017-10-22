import i18n from './i18n';
import base64 from './base64';
import themeColor from './theme-color';
import tag from './tag';
import stylus from './stylus';
import typescript from './typescript';

export default (lang, locale) => [
	i18n(lang, locale),
	base64(),
	themeColor(),
	tag(),
	stylus(),
	typescript()
];
