/**
 * Replace fontawesome symbols
 */

const StringReplacePlugin = require('string-replace-webpack-plugin');
import { pattern, replacement } from '../../../src/common/build/fa';

export default () => ({
	enforce: 'pre',
	test: /\.(vue|js|ts)$/,
	exclude: /node_modules/,
	loader: StringReplacePlugin.replace({
		replacements: [{
			pattern, replacement
		}]
	})
});
