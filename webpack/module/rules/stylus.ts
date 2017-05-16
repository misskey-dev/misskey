/**
 * Stylus support
 */

export default () => ({
	test: /\.styl$/,
	exclude: /node_modules/,
	use: [
		{ loader: 'style-loader' },
		{ loader: 'css-loader' },
		{ loader: 'stylus-loader' }
	]
});
