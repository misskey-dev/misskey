/**
 * Replace fontawesome symbols
 */

import { pattern, replacement } from '../../../src/common/build/fa';

export default () => ({
	enforce: 'pre',
	test: /\.(vue|js|ts)$/,
	exclude: /node_modules/,
	loader: 'string-replace-loader',
	query: {
		search: pattern,
		replace: replacement
	}
});
