import * as fs from 'fs';
import * as webpack from 'webpack';
const WebpackOnBuildPlugin = require('on-build-webpack');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
import chalk from 'chalk';

import consts from './consts';
import hoist from './hoist';
import minify from './minify';

const env = process.env.NODE_ENV;
const isProduction = env === 'production';

export default (version, lang) => {
	const plugins = [
		new HardSourceWebpackPlugin(),
		new ProgressBarPlugin({
			format: chalk`  {cyan.bold yes we can} {bold [}:bar{bold ]} {green.bold :percent} {gray (:current/:total)} :elapseds`,
			clear: false
		}),
		consts(lang),
		new webpack.DefinePlugin({
			'process.env': {
				NODE_ENV: JSON.stringify(process.env.NODE_ENV)
			}
		}),
		new WebpackOnBuildPlugin(stats => {
			fs.writeFileSync('./version.json', JSON.stringify({
				version
			}), 'utf-8');
		})
	];

	if (isProduction) {
		plugins.push(hoist());
		plugins.push(minify());
	}

	return plugins;
};
