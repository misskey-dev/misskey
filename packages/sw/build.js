// @ts-check

const esbuild = require('esbuild');
const locales = require('../../locales');
const meta = require('../../package.json');
const watch = process.argv[2]?.includes('watch');

console.log('Starting SW building...');

/** @type {esbuild.BuildOptions} */
const buildOptions = {
	absWorkingDir: __dirname,
	bundle: true,
	define: {
		_DEV_: JSON.stringify(process.env.NODE_ENV !== 'production'),
		_ENV_: JSON.stringify(process.env.NODE_ENV ?? ''), // `NODE_ENV`は`undefined`になることがあり、そのとき`JSON.stringify`は`undefined`を返してしまう
		_LANGS_: JSON.stringify(Object.entries(locales).map(([k, v]) => [k, v._lang_])),
		_PERF_PREFIX_: JSON.stringify('Misskey:'),
		_VERSION_: JSON.stringify(meta.version),
	},
	entryPoints: [`${__dirname}/src/sw.ts`],
	format: 'esm',
	loader: {
		'.ts': 'ts',
	},
	minify: process.env.NODE_ENV === 'production',
	outbase: `${__dirname}/src`,
	outdir: `${__dirname}/../../built/_sw_dist_`,
	treeShaking: true,
	tsconfig: `${__dirname}/tsconfig.json`,
};

esbuild.context(buildOptions).then(context => {
	if (watch) {
		context
			.watch()
			.then(() => {
				console.log('watching...');
			})
			.catch(() => {
				console.error('SW: watch build failed');
			});
	} else {
		context.dispose();
		console.log('done');
	}
});
