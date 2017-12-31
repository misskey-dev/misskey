/**
 * Inject license
 */

const StringReplacePlugin = require('string-replace-webpack-plugin');
import { licenseHtml } from '../../../src/common/build/license';

export default () => ({
	enforce: 'pre',
	test: /\.(tag|js)$/,
	exclude: /node_modules/,
	loader: StringReplacePlugin.replace({
		replacements: [{
			pattern: '%license%', replacement: () => licenseHtml
		}]
	})
});
