import i18n from './i18n';
import fa from './fa';
//import base64 from './base64';
import vue from './vue';
import stylus from './stylus';
import typescript from './typescript';
import collapseSpaces from './collapse-spaces';

export default lang => [
	//collapseSpaces(),

	//base64(),
	vue(),
	i18n(lang),
	fa(),
	stylus(),
	typescript()
];
