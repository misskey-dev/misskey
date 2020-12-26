/**
 * webpack configuration
 */

import * as fs from 'fs';
import * as webpack from 'webpack';
const { VueLoaderPlugin } = require('vue-loader');

class WebpackOnBuildPlugin {
	constructor(readonly callback: (stats: any) => void) {
	}

	public apply(compiler: any) {
		compiler.hooks.done.tap('WebpackOnBuildPlugin', this.callback);
	}
}

const isProduction = process.env.NODE_ENV === 'production';

const locales = require('./locales');
const meta = require('./package.json');

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

module.exports = Object.keys(isProduction ? locales : {
	'ja-JP': locales['ja-JP']
}).map(lang => ({
	entry: {
		app: './src/client/init.ts',
		sw: './src/client/sw/sw.ts'
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
			}]
		}, {
			test: /\.scss?$/,
			exclude: /node_modules/,
			oneOf: [{
				resourceQuery: /module/,
				use: [{
					loader: 'vue-style-loader'
				}, {
					loader: 'css-loader',
					options: {
						modules: true,
						esModule: false, // TODO: trueにすると壊れる。Vue3移行の折にはtrueにできるかもしれない
						url: false,
					}
				}, postcss, {
					loader: 'sass-loader',
					options: {
						implementation: require('sass'),
						sassOptions: {
							fiber: require('fibers')
						}
					}
				}]
			}, {
				use: [{
					loader: 'vue-style-loader'
				}, {
					loader: 'css-loader',
					options: {
						url: false,
						esModule: false, // TODO: trueにすると壊れる。Vue3移行の折にはtrueにできるかもしれない
					}
				}, postcss, {
					loader: 'sass-loader',
					options: {
						implementation: require('sass'),
						sassOptions: {
							fiber: require('fibers')
						}
					}
				}]
			}]
		}, {
			test: /\.css$/,
			use: [{
				loader: 'vue-style-loader'
			}, {
				loader: 'css-loader',
				options: {
					esModule: false, // TODO: trueにすると壊れる。Vue3移行の折にはtrueにできるかもしれない
				}
			}, postcss]
		}, {
			test: /\.(eot|woff|woff2|svg|ttf)([?]?.*)$/,
			loader: 'url-loader'
		}, {
			test: /\.json5$/,
			loader: 'json5-loader',
			options: {
				esModule: false,
			},
			type: 'javascript/auto'
		}, {
			test: /\.ts$/,
			exclude: /node_modules/,
			use: [{
				loader: 'ts-loader',
				options: {
					happyPackMode: true,
					transpileOnly: true,
					configFile: __dirname + '/src/client/tsconfig.json',
					appendTsSuffixTo: [/\.vue$/]
				}
			}]
		}]
	},
	plugins: [
		new webpack.ProgressPlugin({}),
		new webpack.DefinePlugin({
			_VERSION_: JSON.stringify(meta.version),
			_LANG_: JSON.stringify(lang),
			_LANGS_: JSON.stringify(Object.entries(locales).map(([k, v]: [string, any]) => [k, v._lang_])),
			_LOCALE_: JSON.stringify(locales[lang]),
			_ENV_: JSON.stringify(process.env.NODE_ENV),
			_DEV_: process.env.NODE_ENV !== 'production',
			_PERF_PREFIX_: JSON.stringify('Misskey:'),
			_DATA_TRANSFER_DRIVE_FILE_: JSON.stringify('mk_drive_file'),
			_DATA_TRANSFER_DRIVE_FOLDER_: JSON.stringify('mk_drive_folder'),
			_DATA_TRANSFER_DECK_COLUMN_: JSON.stringify('mk_deck_column'),
			__VUE_OPTIONS_API__: true,
			__VUE_PROD_DEVTOOLS__: false,
			__VUE_I18N_LEGACY_API__: false,
		}),
		new VueLoaderPlugin(),
		new WebpackOnBuildPlugin((stats: any) => {
			fs.writeFileSync('./built/meta.json', JSON.stringify({ version: meta.version }), 'utf-8');
		}),
	],
	output: {
		path: __dirname + '/built/client/assets',
		filename: `[name].${meta.version}.${lang}.js`,
		publicPath: `/assets/`
	},
	resolve: {
		extensions: [
			'.js', '.ts', '.json'
		],
		alias: {
			'@': __dirname + '/src/client',
			'const.styl': __dirname + '/src/client/const.styl'
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
}));
