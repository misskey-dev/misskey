/**
 * Riot tags
 */

export default () => ({
	test: /\.tag$/,
	exclude: /node_modules/,
	loader: 'riot-tag-loader',
	query: {
		hot: false,
		style: 'stylus',
		expr: false,
		compact: true,
		parserOptions: {
			style: {
				compress: true
			}
		}
	}
});
