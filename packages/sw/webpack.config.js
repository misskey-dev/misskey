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

const postcss = {
	loader: 'postcss-loader',
	options: {
		postcssOptions: {
			plugins: [
				require('cssnano')({
					preset: 'default'
				})
			]
		}
	},
};

module.exports = {
	entry: {
		sw: './src/sw.ts'
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
					appendTsSuffixTo: [/\.vue$/]
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
		new WebpackOnBuildPlugin(() => {
			fs.mkdirSync(__dirname + '/../../built', { recursive: true });
			fs.writeFileSync(__dirname + '/../../built/meta.json', JSON.stringify({ version: meta.version }), 'utf-8');
		}),
	],
	output: {
		path: __dirname + '/../../built/_sw_dist_',
		filename: `[name].${meta.version}.js`,
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
	experiments: {
		topLevelAwait: true
	},
	devtool: false, //'source-map',
	mode: isProduction ? 'production' : 'development'
};
