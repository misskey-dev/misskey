/**
 * webpack configuration
 */

import * as fs from 'fs';
import * as webpack from 'webpack';
import chalk from 'chalk';
const { VueLoaderPlugin } = require('vue-loader');
const WebpackOnBuildPlugin = require('on-build-webpack');
//const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');

const constants = require('./src/const.json');

const locales = require('./locales');
const meta = require('./package.json');
const version = meta.clientVersion;
const codename = meta.codename;

const langs = Object.keys(locales);

const isProduction = process.env.NODE_ENV == 'production';

// Entries
const entry = {
	desktop: './src/client/app/desktop/script.ts',
	mobile: './src/client/app/mobile/script.ts',
	dev: './src/client/app/dev/script.ts',
	auth: './src/client/app/auth/script.ts',
	admin: './src/client/app/admin/script.ts',
	sw: './src/client/app/sw.js'
};

const output = {
	path: __dirname + '/built/client/assets',
	filename: `[name].${version}.-.js`
};

//#region Define consts
const consts = {
	_THEME_COLOR_: constants.themeColor,
	_COPYRIGHT_: constants.copyright,
	_VERSION_: meta.version,
	_CLIENT_VERSION_: version,
	_CODENAME_: codename,
	_LANG_: '%lang%',
	_LANGS_: Object.keys(locales).map(l => [l, locales[l].meta.lang]),
	_LOCALE_: '%locale%',
	_ENV_: process.env.NODE_ENV
};

const _consts: { [ key: string ]: any } = {};

Object.keys(consts).forEach(key => {
	_consts[key] = JSON.stringify((consts as any)[key]);
});
//#endregion

const plugins = [
	//new HardSourceWebpackPlugin(),
	new ProgressBarPlugin({
		format: chalk`  {cyan.bold yes we can} {bold [}:bar{bold ]} {green.bold :percent} {gray (:current/:total)} :elapseds`,
		clear: false
	}),
	new webpack.DefinePlugin(_consts),
	new webpack.DefinePlugin({
		'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development')
	}),
	new WebpackOnBuildPlugin((stats: any) => {
		fs.writeFileSync('./built/client/meta.json', JSON.stringify({
			version
		}), 'utf-8');

		//#region i18n
		langs.forEach(lang => {
			Object.keys(entry).forEach(file => {
				let src = fs.readFileSync(`${__dirname}/built/client/assets/${file}.${version}.-.js`, 'utf-8');

				src = src.replace('%lang%', lang);
				src = src.replace('"%locale%"', JSON.stringify(locales[lang]));

				fs.writeFileSync(`${__dirname}/built/client/assets/${file}.${version}.${lang}.js`, src, 'utf-8');
			});
		});
		//#endregion
	}),
	new VueLoaderPlugin()
];

if (isProduction) {
	plugins.push(new webpack.optimize.ModuleConcatenationPlugin());
}

module.exports = {
	entry,
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
						modules: true,
						minimize: true
					}
				}, {
					loader: 'stylus-loader'
				}]
			}, {
				use: [{
					loader: 'vue-style-loader'
				}, {
					loader: 'css-loader',
					options: {
						minimize: true
					}
				}, {
					loader: 'stylus-loader'
				}]
			}]
		}, {
			test: /\.css$/,
			use: [{
				loader: 'vue-style-loader'
			}, {
				loader: 'css-loader',
				options: {
					minimize: true
				}
			}]
		}, {
			test: /\.(eot|woff|woff2|svg|ttf)([\?]?.*)$/,
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
	plugins,
	output,
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
	cache: true,
	devtool: false, //'source-map',
	mode: isProduction ? 'production' : 'development'
};
