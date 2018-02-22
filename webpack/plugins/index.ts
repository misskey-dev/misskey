import consts from './consts';
import hoist from './hoist';
import minify from './minify';

const env = process.env.NODE_ENV;
const isProduction = env === 'production';

export default (version, lang) => {
	const plugins = [
		consts(lang)
	];

	if (isProduction) {
		plugins.push(hoist());
		plugins.push(minify());
	}

	return plugins;
};
