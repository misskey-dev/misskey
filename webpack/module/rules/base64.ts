/**
 * Replace base64 symbols
 */

import * as fs from 'fs';

export default () => ({
	enforce: 'pre',
	test: /\.(vue|js)$/,
	exclude: /node_modules/,
	loader: 'string-replace-loader',
	query: {
		search: /%base64:(.+?)%/g,
		replace: (_, key) => {
			return fs.readFileSync(__dirname + '/../../../src/web/' + key, 'base64');
		}
	}
});
