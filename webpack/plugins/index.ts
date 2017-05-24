const StringReplacePlugin = require('string-replace-webpack-plugin');

import constant from './const';
import minify from './minify';

const env = process.env.NODE_ENV;
const isProduction = env === 'production';

export default () => {
	const plugins = [
		constant(),
		new StringReplacePlugin()
	];

	if (isProduction) {
		plugins.push(minify());
	}

	return plugins;
};
