/**
 * Inject license
 */

import * as fs from 'fs';
const StringReplacePlugin = require('string-replace-webpack-plugin');

const license = fs.readFileSync(__dirname + '/../../../LICENSE', 'utf-8')
	.replace(/\r\n/g, '\n')
	.replace(/(.)\n(.)/g, '$1 $2')
	.replace(/(^|\n)(.*?)($|\n)/g, '<p>$2</p>');

export default () => ({
	enforce: 'pre',
	test: /\.(tag|js)$/,
	exclude: /node_modules/,
	loader: StringReplacePlugin.replace({
		replacements: [{
			pattern: '%license%', replacement: () => license
		}]
	})
});
