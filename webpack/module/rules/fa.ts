/**
 * Replace fontawesome symbols
 */

import { pattern, replacement } from '../../../src/common/build/fa';

export default () => ({
	//enforce: 'pre',
	test: /\.(vue|js|ts)$/,
	exclude: /node_modules/,
	loader: 'replace',
	query: {
		search: pattern.toString(),
		replace: replacement
	}
});
