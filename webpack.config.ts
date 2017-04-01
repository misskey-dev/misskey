/**
 * webpack config
 */

import * as fs from 'fs';
import * as webpack from 'webpack';
const StringReplacePlugin = require('string-replace-webpack-plugin');
import * as yaml from 'js-yaml';

import version from './src/version';
const constants = require('./src/const.json');

const languages = {
	'en': yaml.safeLoad(fs.readFileSync('./locales/en.yml', 'utf-8')),
	'ja': yaml.safeLoad(fs.readFileSync('./locales/ja.yml', 'utf-8'))
};

const native = languages.ja;

const env = process.env.NODE_ENV;
const isProduction = env === 'production';

module.exports = (Object as any).entries(languages).map(([lang, locale]) => {
	locale = Object.assign({}, native, locale);

	const pack /*: webpack.Configuration ← fuck wrong type definition!!! */ = {
		name: lang,
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
					test: /\.(tag|js)$/,
					exclude: /node_modules/,
					loader: StringReplacePlugin.replace({
						replacements: [
							{
								pattern: /%i18n:(.+?)%/g, replacement: (_, key) => {
									let text = locale;
									const error = key.split('.').some(k => {
										if (text.hasOwnProperty(k)) {
											text = text[k];
											return false;
										} else {
											return true;
										}
									});
									if (error) {
										console.warn(`key '${key}' not found in '${lang}'`);
										return key;
									} else {
										return text.replace(/'/g, '\\\'').replace(/"/g, '\\"');
									}
								}
							}
						]
					})
				},
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
						{ loader: 'style-loader' },
						{ loader: 'css-loader' },
						{ loader: 'stylus-loader' }
					]
				}
			]
		},
		plugins: [
			new webpack.DefinePlugin({
				VERSION: JSON.stringify(version),
				THEME_COLOR: JSON.stringify(constants.themeColor)
			}),
			new StringReplacePlugin()
		],
		output: {
			path: __dirname + '/built/web/assets',
			filename: `[name].${version}.${lang}.js`
		}
	};

	if (isProduction) {
		//pack.plugins.push(new webpack.optimize.UglifyJsPlugin());
	}

	return pack;
});
