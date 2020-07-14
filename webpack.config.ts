/**
 * webpack configuration
 */

import * as fs from 'fs';
import * as webpack from 'webpack';
import * as chalk from 'chalk';
const { VueLoaderPlugin } = require('vue-loader');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

class WebpackOnBuildPlugin {
	constructor(readonly callback: (stats: any) => void) {
	}

	public apply(compiler: any) {
		compiler.hooks.done.tap('WebpackOnBuildPlugin', this.callback);
	}
}

const isProduction = process.env.NODE_ENV == 'production';
const useHardSource = process.env.MISSKEY_USE_HARD_SOURCE;

const constants = require('./src/const.json');

const locales = require('./locales');
const meta = require('./package.json');
const codename = meta.codename;

const postcss = {
	loader: 'postcss-loader',
	options: {
		plugins: [
			require('cssnano')({
				preset: 'default'
			})
		]
	},
};

module.exports = {
	entry: {
		desktop: './src/client/app/desktop/script.ts',
		mobile: './src/client/app/mobile/script.ts',
		// dev: './src/client/app/dev/script.ts',
		// auth: './src/client/app/auth/script.ts',
		// admin: './src/client/app/admin/script.ts',
		// sw: './src/client/app/sw.js'
	},
	module: {
		rules: [{
			test: /\.vue$/,
			exclude: /node_modules/,
			use: [{
				loader: 'vue-loader',
				options: {
					cssSourceMap: false,
					compilerOptions: {
						preserveWhitespace: false
					}
				}
			}, {
				loader: 'vue-svg-inline-loader'
			}]
		}, {
			test: /\.styl(us)?$/,
			exclude: /node_modules/,
			oneOf: [{
				resourceQuery: /module/,
				use: [{
					loader: 'vue-style-loader'
				}, {
					loader: 'css-loader',
					options: {
						modules: true
					}
				}, postcss, {
					loader: 'stylus-loader'
				}]
			}, {
				use: [{
					loader: 'vue-style-loader'
				}, {
					loader: 'css-loader'
				}, postcss, {
					loader: 'stylus-loader'
				}]
			}]
		}, {
			test: /\.css$/,
			use: [{
				loader: 'vue-style-loader'
			}, {
				loader: 'css-loader'
			}, postcss]
		}, {
			test: /\.(eot|woff|woff2|svg|ttf)([?]?.*)$/,
			loader: 'url-loader'
		}, {
			test: /\.json5$/,
			loader: 'json5-loader'
		}, {
			test: /\.ts$/,
			exclude: /node_modules/,
			use: [{
				loader: 'ts-loader',
				options: {
					happyPackMode: true,
					configFile: __dirname + '/src/client/app/tsconfig.json',
					appendTsSuffixTo: [/\.vue$/]
				}
			}]
		}]
	},
	plugins: [
		...(useHardSource ? [new HardSourceWebpackPlugin()] : []),
		new ProgressBarPlugin({
			format: chalk`  {cyan.bold yes we can} {bold [}:bar{bold ]} {green.bold :percent} {gray (:current/:total)} :elapseds`,
			clear: false
		}),
		new webpack.DefinePlugin({
			_COPYRIGHT_: JSON.stringify(constants.copyright),
			_VERSION_: JSON.stringify(meta.version),
			_CODENAME_: JSON.stringify(codename),
			_LANGS_: JSON.stringify(Object.entries(locales).map(([k, v]: [string, any]) => [k, v && v.meta && v.meta.lang])),
			_ENV_: JSON.stringify(process.env.NODE_ENV)
		}),
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development')
		}),
		new WebpackOnBuildPlugin((stats: any) => {
			fs.writeFileSync('./built/meta.json', JSON.stringify({ version: meta.version }), 'utf-8');

			fs.mkdirSync('./built/client/assets/locales', { recursive: true });

			for (const [lang, locale] of Object.entries(locales))
				fs.writeFileSync(`./built/client/assets/locales/${lang}.json`, JSON.stringify(locale), 'utf-8');
		}),
		new VueLoaderPlugin(),
		new webpack.optimize.ModuleConcatenationPlugin()
	],
	output: {
		path: __dirname + '/built/client/assets',
		filename: `[name].${meta.version}.js`,
		publicPath: `/assets/`
	},
	resolve: {
		extensions: [
			'.js', '.ts', '.json'
		],
		alias: {
			'const.styl': __dirname + '/src/client/const.styl'
		}
	},
	resolveLoader: {
		modules: ['node_modules']
	},
	optimization: {
		minimizer: [new TerserPlugin()]
	},
	cache: true,
	devtool: 'source-map',
	mode: isProduction ? 'production' : 'development'
};
