/**
 * Replace i18n texts
 */

import Replacer from '../../../src/common/build/i18n';

export default lang => {
	const replacer = new Replacer(lang);

	return {
		enforce: 'pre',
		test: /\.(vue|js|ts)$/,
		exclude: /node_modules/,
		use: [{
			loader: 'replace-string-loader',
			options: {
				search: replacer.pattern,
				replace: replacer.replacement
			}
		}]
	};
};
