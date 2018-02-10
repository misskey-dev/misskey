import i18n from './i18n';
import license from './license';
import fa from './fa';
import base64 from './base64';
import themeColor from './theme-color';
import vue from './vue';
import stylus from './stylus';
import typescript from './typescript';

export default lang => [
	i18n(lang),
	license(),
	fa(),
	base64(),
	themeColor(),
	vue(),
	stylus(),
	typescript()
];
