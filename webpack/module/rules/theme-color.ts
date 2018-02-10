/**
 * Theme color provider
 */

const StringReplacePlugin = require('string-replace-webpack-plugin');

const constants = require('../../../src/const.json');

export default () => ({
	enforce: 'pre',
	test: /\.vue$/,
	exclude: /node_modules/,
	loader: StringReplacePlugin.replace({
		replacements: [
			{
				pattern: /\$theme\-color\-foreground/g,
				replacement: () => constants.themeColorForeground
			},
			{
				pattern: /\$theme\-color/g,
				replacement: () => constants.themeColor
			},
		]
	})
});
