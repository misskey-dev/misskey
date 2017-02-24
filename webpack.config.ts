import * as webpack from 'webpack';
const StringReplacePlugin = require('string-replace-webpack-plugin');

const constants = require('./src/const.json');

module.exports = (commit, env) => {
	const isProduction = env === 'production';

	const pack: webpack.Configuration = {
		entry: {
			'desktop': './src/web/app/desktop/script.js',
			'mobile': './src/web/app/mobile/script.js',
			'dev': './src/web/app/dev/script.js',
			'auth': './src/web/app/auth/script.js'
		},
		module: {
			rules: [
				{
					enforce: 'pre',
					test: /\.tag$/,
					exclude: /node_modules/,
					loader: StringReplacePlugin.replace({
						replacements: [
							{ pattern: /\$theme\-color\-foreground/g, replacement: () => constants.themeColorForeground },
							{ pattern: /\$theme\-color/g, replacement: () => constants.themeColor },
						]
					})
				},
				{
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
				},
				{
					test: /\.styl$/,
					exclude: /node_modules/,
					use: [
						{
							loader: 'style-loader'
						},
						{
							loader: 'css-loader'
						},
						{
							loader: 'stylus-loader'
						}
					]
				}
			]
		},
		plugins: [
			new webpack.DefinePlugin({
				VERSION: JSON.stringify(commit ? commit.hash : null),
				CONFIG: {
					themeColor: JSON.stringify(constants.themeColor)
				}
			}),
			new StringReplacePlugin(),
		],
		output: {
			filename: '[name]/script.js'
		}
	};

	if (isProduction) {
		// TODO.
		// see https://github.com/webpack/webpack/issues/2545
		//pack.plugins.push(new Webpack.optimize.UglifyJsPlugin())
	}

	return pack;
};
