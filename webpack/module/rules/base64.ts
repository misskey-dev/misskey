/**
 * Replace base64 symbols
 */

import * as fs from 'fs';
const StringReplacePlugin = require('string-replace-webpack-plugin');

export default () => ({
	enforce: 'pre',
	test: /\.(vue|js)$/,
	exclude: /node_modules/,
	loader: StringReplacePlugin.replace({
		replacements: [{
			pattern: /%base64:(.+?)%/g, replacement: (_, key) => {
				return fs.readFileSync(__dirname + '/../../../src/web/' + key, 'base64');
			}
		}]
	})
});
