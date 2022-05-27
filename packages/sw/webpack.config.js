/**
 * webpack configuration
 */

const fs = require('fs');
const webpack = require('webpack');

class WebpackOnBuildPlugin {
	constructor(callback) {
		this.callback = callback;
	}

	apply(compiler) {
		compiler.hooks.done.tap('WebpackOnBuildPlugin', this.callback);
	}
}

const isProduction = process.env.NODE_ENV === 'production';

const locales = require('../../locales');
const meta = require('../../package.json');

module.exports = {
	target: 'webworker',
	entry: {
		['sw-lib']: './src/lib.ts'
	},
	module: {
		rules: [{
			test: /\.ts$/,
			exclude: /node_modules/,
			use: [{
				loader: 'ts-loader',
				options: {
					happyPackMode: true,
					transpileOnly: true,
					configFile: __dirname + '/tsconfig.json',
				}
			}]
		}]
	},
	plugins: [
		new webpack.ProgressPlugin({}),
		new webpack.DefinePlugin({
			_VERSION_: JSON.stringify(meta.version),
			_LANGS_: JSON.stringify(Object.entries(locales).map(([k, v]) => [k, v._lang_])),
			_ENV_: JSON.stringify(process.env.NODE_ENV),
			_DEV_: process.env.NODE_ENV !== 'production',
			_PERF_PREFIX_: JSON.stringify('Misskey:'),
		}),
	],
	output: {
		path: __dirname + '/../../built/_sw_dist_',
		filename: `[name].js`,
		publicPath: `/`,
		pathinfo: false,
	},
	resolve: {
		extensions: [
			'.js', '.ts', '.json'
		],
		alias: {
			'@': __dirname + '/src/',
		}
	},
	resolveLoader: {
		modules: ['node_modules']
	},
	devtool: false, //'source-map',
	mode: isProduction ? 'production' : 'development'
};
