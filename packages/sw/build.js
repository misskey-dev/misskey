const esbuild = require('esbuild');
const locales = require('../../locales');
const meta = require('../../package.json');
const watch = process.argv[2]?.includes('watch');

console.log('Starting SW building...');

esbuild.build({
	entryPoints: [ `${__dirname}/src/sw.ts` ],
	bundle: true,
	format: 'esm',
	treeShaking: true,
	minify: process.env.NODE_ENV === 'production',
	absWorkingDir: __dirname,
	outbase: `${__dirname}/src`,
	outdir: `${__dirname}/../../built/_sw_dist_`,
	loader: {
		'.ts': 'ts'
	},
	tsconfig: `${__dirname}/tsconfig.json`,
	define: {
		_VERSION_: JSON.stringify(meta.version),
		_LANGS_: JSON.stringify(Object.entries(locales).map(([k, v]) => [k, v._lang_])),
		_ENV_: JSON.stringify(process.env.NODE_ENV),
		_DEV_: process.env.NODE_ENV !== 'production',
		_PERF_PREFIX_: JSON.stringify('Misskey:'),
	},
	watch: watch ? {
		onRebuild(error, result) {
      if (error) console.error('SW: watch build failed:', error);
      else console.log('SW: watch build succeeded:', result);
		},
	} : false,
}).then(result => {
	if (watch) console.log('watching...');
	else console.log('done,', JSON.stringify(result));
});
