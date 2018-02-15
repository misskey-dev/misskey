/**
 * Vue
 */

const constants = require('../../../src/const.json');

export default () => ({
	test: /\.vue$/,
	exclude: /node_modules/,
	use: [{
		loader: 'vue-loader',
		options: {
			cssSourceMap: false,
			preserveWhitespace: false
		}
	}, {
		loader: 'webpack-replace-loader',
		options: {
			search: '$theme-color',
			replace: constants.themeColor,
			attr: 'g'
		}
	}, {
		loader: 'webpack-replace-loader',
		query: {
			search: '$theme-color-foreground',
			replace: constants.themeColorForeground,
			attr: 'g'
		}
	}]
});
