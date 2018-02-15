/**
 * Vue
 */

export default () => ({
	test: /\.vue$/,
	exclude: /node_modules/,
	loader: 'vue-loader',
	options: {
		cssSourceMap: false,
		preserveWhitespace: false
	}
});
