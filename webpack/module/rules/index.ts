import i18n from './i18n';
import fa from './fa';
import base64 from './base64';
import themeColor from './theme-color';
import tag from './tag';
import stylus from './stylus';
import typescript from './typescript';

export default (lang, locale) => [
	i18n(lang, locale),
	fa(),
	base64(),
	themeColor(),
	tag(),
	stylus(),
	typescript()
];
