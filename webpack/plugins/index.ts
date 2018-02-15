const StringReplacePlugin = require('string-replace-webpack-plugin');

import consts from './consts';
import hoist from './hoist';
import minify from './minify';
import banner from './banner';

const env = process.env.NODE_ENV;
const isProduction = env === 'production';

export default (version, lang) => {
	const plugins = [
		consts(lang),
		new StringReplacePlugin()
	];

	if (isProduction) {
		plugins.push(hoist());
		plugins.push(minify());
	}

	plugins.push(banner(version));

	return plugins;
};
