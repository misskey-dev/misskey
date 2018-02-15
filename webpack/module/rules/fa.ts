/**
 * Replace fontawesome symbols
 */

import { pattern, replacement } from '../../../src/common/build/fa';

export default () => ({
	enforce: 'pre',
	test: /\.(vue|js|ts)$/,
	exclude: /node_modules/,
	use: [{
		loader: 'replace-string-loader',
		options: {
			search: pattern,
			replace: replacement
		}
	}]
});
