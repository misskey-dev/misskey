/**
 * webpack configuration
 */

import * as fs from 'fs';
import * as webpack from 'webpack';
import chalk from 'chalk';
const { VueLoaderPlugin } = require('vue-loader');
import jsonImporter from 'node-sass-json-importer';
const minifyHtml = require('html-minifier').minify;
const WebpackOnBuildPlugin = require('on-build-webpack');
//const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');

import I18nReplacer from './src/build/i18n';
import { pattern as faPattern, replacement as faReplacement } from './src/build/fa';
const constants = require('./src/const.json');
import config from './src/config';
import { licenseHtml } from './src/build/license';

import locales from './locales';
const meta = require('./package.json');
const version = meta.clientVersion;
const codename = meta.codename;

//#region Replacer definitions
global['faReplacement'] = faReplacement;

global['collapseSpacesReplacement'] = html => {
	return minifyHtml(html, {
		collapseWhitespace: true,
		collapseInlineTagWhitespace: true,
		keepClosingSlash: true
	}).replace(/\t/g, '');
};

global['base64replacement'] = (_, key) => {
	return fs.readFileSync(__dirname + '/src/client/' + key, 'base64');
};
//#endregion

const langs = Object.keys(locales);

// 無圧縮スクリプトを用意するのは重いので一時的に無効化
//const entries = process.env.NODE_ENV == 'production'
//	? langs.map(l => [l, false]).concat(langs.map(l => [l, true]))
//	: langs.map(l => [l, false]);
const entries = process.env.NODE_ENV == 'production'
	? langs.map(l => [l, true])
	: langs.map(l => [l, false]);

module.exports = entries.map(x => {
	const [lang, isProduction] = x;

	// Chunk name
	const name = lang;

	// Entries
	const entry = {
		desktop: './src/client/app/desktop/script.ts',
		mobile: './src/client/app/mobile/script.ts',
		//ch: './src/client/app/ch/script.ts',
		//stats: './src/client/app/stats/script.ts',
		//status: './src/client/app/status/script.ts',
		dev: './src/client/app/dev/script.ts',
		auth: './src/client/app/auth/script.ts',
		sw: './src/client/app/sw.js'
	};

	const output = {
		path: __dirname + '/built/client/assets',
		filename: `[name].${version}.${lang}.${isProduction ? 'min' : 'raw'}.js`
	};

	const i18nReplacer = new I18nReplacer(lang as string);
	global['i18nReplacement'] = i18nReplacer.replacement;

	//#region Define consts
	const consts = {
		_RECAPTCHA_SITEKEY_: config.recaptcha.site_key,
		_SW_PUBLICKEY_: config.sw ? config.sw.public_key : null,
		_THEME_COLOR_: constants.themeColor,
		_COPYRIGHT_: constants.copyright,
		_VERSION_: version,
		_CODENAME_: codename,
		_STATUS_URL_: config.status_url,
		_STATS_URL_: config.stats_url,
		_DOCS_URL_: config.docs_url,
		_API_URL_: config.api_url,
		_WS_URL_: config.ws_url,
		_DEV_URL_: config.dev_url,
		_LANG_: lang,
		_HOST_: config.host,
		_HOSTNAME_: config.hostname,
		_URL_: config.url,
		_LICENSE_: licenseHtml,
		_GOOGLE_MAPS_API_KEY_: config.google_maps_api_key
	};

	const _consts = {};

	Object.keys(consts).forEach(key => {
		_consts[key] = JSON.stringify(consts[key]);
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
		new WebpackOnBuildPlugin(stats => {
			fs.writeFileSync('./built/client/meta.json', JSON.stringify({
				version
			}), 'utf-8');
		}),
		new VueLoaderPlugin()
	];

	if (isProduction) {
		plugins.push(new webpack.optimize.ModuleConcatenationPlugin());
	}

	return {
		name,
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
					loader: 'replace',
					query: {
						search: /%base64:(.+?)%/g.toString(),
						replace: 'base64replacement'
					}
				}, {
					loader: 'replace',
					query: {
						search: i18nReplacer.pattern.toString(),
						replace: 'i18nReplacement',
						i18n: true,
						lang
					}
				}, {
					loader: 'replace',
					query: {
						search: faPattern.toString(),
						replace: 'faReplacement'
					}
				}, {
					loader: 'replace',
					query: {
						search: /^<template>([\s\S]+?)\r?\n<\/template>/.toString(),
						replace: 'collapseSpacesReplacement'
					}
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
				test: /\.scss$/,
				exclude: /node_modules/,
				use: [{
					loader: 'style-loader'
				}, {
					loader: 'css-loader',
					options: {
						minimize: true
					}
				}, {
					loader: 'sass-loader',
					options: {
						importer: jsonImporter,
					}
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
				test: /\.ts$/,
				exclude: /node_modules/,
				use: [{
					loader: 'ts-loader',
					options: {
						happyPackMode: true,
						configFile: __dirname + '/src/client/app/tsconfig.json',
						appendTsSuffixTo: [/\.vue$/]
					}
				}, {
					loader: 'replace',
					query: {
						search: i18nReplacer.pattern.toString(),
						replace: 'i18nReplacement',
						i18n: true,
						lang
					}
				}, {
					loader: 'replace',
					query: {
						search: faPattern.toString(),
						replace: 'faReplacement'
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
			modules: ['node_modules', './webpack/loaders']
		},
		cache: true,
		devtool: false, //'source-map',
		mode: isProduction ? 'production' : 'development'
	};
});
