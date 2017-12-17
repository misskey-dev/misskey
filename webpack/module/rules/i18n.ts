/**
 * Replace i18n texts
 */

const StringReplacePlugin = require('string-replace-webpack-plugin');
import Replacer from '../../../src/common/build/i18n';

export default lang => {
	const replacer = new Replacer(lang);

	return {
		enforce: 'pre',
		test: /\.(tag|js|ts)$/,
		exclude: /node_modules/,
		loader: StringReplacePlugin.replace({
			replacements: [{
				pattern: replacer.pattern, replacement: replacer.replacement
			}]
		})
	};
};
