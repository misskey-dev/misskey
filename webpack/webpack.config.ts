/**
 * webpack configuration
 */

import module_ from './module';
import plugins from './plugins';

import langs from './langs';
import version from '../src/version';

module.exports = langs.map(([lang, locale]) => {
	// Chunk name
	const name = lang;

	// Entries
	const entry = {
		desktop: './src/web/app/desktop/script.js',
		mobile: './src/web/app/mobile/script.js',
		ch: './src/web/app/ch/script.js',
		stats: './src/web/app/stats/script.js',
		status: './src/web/app/status/script.js',
		dev: './src/web/app/dev/script.js',
		auth: './src/web/app/auth/script.js'
	};

	const output = {
		path: __dirname + '/../built/web/assets',
		filename: `[name].${version}.${lang}.js`
	};

	return {
		name,
		entry,
		module: module_(lang, locale),
		plugins: plugins(version, lang),
		output
	};
});
