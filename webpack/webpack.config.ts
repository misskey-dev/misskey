/**
 * webpack configuration
 */

import module_ from './module';
import plugins from './plugins';

import langs from '../locales';
import version from '../src/version';

module.exports = Object.keys(langs).map(lang => {
	// Chunk name
	const name = lang;

	// Entries
	const entry = {
		desktop: './src/web/app/desktop/script.ts',
		//mobile: './src/web/app/mobile/script.ts',
		//ch: './src/web/app/ch/script.ts',
		//stats: './src/web/app/stats/script.ts',
		//status: './src/web/app/status/script.ts',
		//dev: './src/web/app/dev/script.ts',
		//auth: './src/web/app/auth/script.ts',
		sw: './src/web/app/sw.js'
	};

	const output = {
		path: __dirname + '/../built/web/assets',
		filename: `[name].${version}.${lang}.js`
	};

	return {
		name,
		entry,
		module: module_(lang),
		plugins: plugins(version, lang),
		output,
		resolve: {
			extensions: [
				'.js', '.ts'
			]
		},
		resolveLoader: {
			modules: ['node_modules', './webpack/loaders']
		},
		cache: true,
		devtool: 'eval',
		stats: true,
		profile: true
	};
});
