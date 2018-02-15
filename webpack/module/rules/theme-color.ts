/**
 * Theme color provider
 */

const constants = require('../../../src/const.json');

export default () => ({
	enforce: 'pre',
	test: /\.vue$/,
	exclude: /node_modules/,
	use: [{
		loader: 'replace-string-loader',
		options: {
			search: '$theme-color-foreground',
			replace: constants.themeColorForeground,
			flags: 'g'
		}
	}, {
		loader: 'replace-string-loader',
		options: {
			search: '$theme-color',
			replace: constants.themeColor,
			flags: 'g'
		}
	}]
});
