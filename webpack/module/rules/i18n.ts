/**
 * Replace i18n texts
 */

import Replacer from '../../../src/common/build/i18n';

export default lang => {
	const replacer = new Replacer(lang);

	return {
		//enforce: 'post',
		test: /\.(vue|js|ts)$/,
		exclude: /node_modules/,
		loader: 'replace',
		query: {
			search: replacer.pattern.toString(),
			replace: replacer.replacement
		}
	};
};
