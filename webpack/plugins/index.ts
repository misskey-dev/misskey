const StringReplacePlugin = require('string-replace-webpack-plugin');

import constant from './const';
import hoist from './hoist';
import minify from './minify';
import banner from './banner';

const env = process.env.NODE_ENV;
const isProduction = env === 'production';

export default (version, lang) => {
	const plugins = [
		constant(lang),
		new StringReplacePlugin(),
		hoist()
	];

	if (isProduction) {
		plugins.push(minify());
	}

	plugins.push(banner(version));

	return plugins;
};
