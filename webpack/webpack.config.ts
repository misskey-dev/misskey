/**
 * webpack configuration
 */

import * as fs from 'fs';
import jsonImporter from 'node-sass-json-importer';
const minify = require('html-minifier').minify;
import I18nReplacer from '../src/common/build/i18n';
import { pattern as faPattern, replacement as faReplacement } from '../src/common/build/fa';
const constants = require('../src/const.json');

import plugins from './plugins';

import langs from '../locales';
import version from '../src/version';

global['faReplacement'] = faReplacement;

global['collapseSpacesReplacement'] = html => {
	return minify(html, {
		collapseWhitespace: true,
		collapseInlineTagWhitespace: true,
		keepClosingSlash: true
	}).replace(/\t/g, '');
};

global['base64replacement'] = (_, key) => {
	return fs.readFileSync(__dirname + '/../src/web/' + key, 'base64');
};

module.exports = Object.keys(langs).map(lang => {
	// Chunk name
	const name = lang;

	// Entries
	const entry = {
		desktop: './src/web/app/desktop/script.ts',
		mobile: './src/web/app/mobile/script.ts',
		//ch: './src/web/app/ch/script.ts',
		//stats: './src/web/app/stats/script.ts',
		//status: './src/web/app/status/script.ts',
		dev: './src/web/app/dev/script.ts',
		auth: './src/web/app/auth/script.ts',
		sw: './src/web/app/sw.js'
	};

	const output = {
		path: __dirname + '/../built/web/assets',
		filename: `[name].${version}.${lang}.js`
	};

	const i18nReplacer = new I18nReplacer(lang);
	global['i18nReplacement'] = i18nReplacer.replacement;

	return {
		name,
		entry,
		module: {
			rules: [{
				test: /\.vue$/,
				exclude: /node_modules/,
				use: [/*'cache-loader', */{
					loader: 'vue-loader',
					options: {
						cssSourceMap: false,
						preserveWhitespace: false
					}
				}, {
					loader: 'replace',
					query: {
						search: /%base64:(.+?)%/g.toString(),
						replace: 'base64replacement'
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
				}, {
					loader: 'replace',
					query: {
						search: i18nReplacer.pattern.toString(),
						replace: 'i18nReplacement'
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
				test: /\.styl$/,
				exclude: /node_modules/,
				use: [
					{ loader: 'style-loader' },
					{ loader: 'css-loader' },
					{ loader: 'stylus-loader' }
				]
			}, {
				test: /\.scss$/,
				exclude: /node_modules/,
				use: [{
					loader: 'style-loader'
				}, {
					loader: 'css-loader'
				}, {
					loader: 'sass-loader',
					options: {
						importer: jsonImporter,
					}
				}]
			}, {
				test: /\.css$/,
				use: [
					{ loader: 'style-loader' },
					{ loader: 'css-loader' }
				]
			}, {
				test: /\.(eot|woff|woff2|svg|ttf)([\?]?.*)$/,
				loader: 'file-loader'
			}, {
				test: /\.ts$/,
				exclude: /node_modules/,
				use: [{
					loader: 'ts-loader',
					options: {
						configFile: __dirname + '/../src/web/app/tsconfig.json',
						appendTsSuffixTo: [/\.vue$/]
					}
				}, {
					loader: 'replace',
					query: {
						search: i18nReplacer.pattern.toString(),
						replace: 'i18nReplacement'
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
		plugins: plugins(version, lang),
		output,
		resolve: {
			extensions: [
				'.js', '.ts', '.json'
			]
		},
		resolveLoader: {
			modules: ['node_modules', './webpack/loaders']
		},
		cache: true
	};
});
