/**
 * Gulp tasks
 */

import * as fs from 'fs';
import * as gulp from 'gulp';
import * as ts from 'gulp-typescript';
import * as rimraf from 'rimraf';
import * as replace from 'gulp-replace';
const terser = require('gulp-terser');
const cssnano = require('gulp-cssnano');

const locales: { [x: string]: any } = require('./locales');
const meta = require('./package.json');

gulp.task('build:ts', () => {
	const tsProject = ts.createProject('./tsconfig.json');

	return tsProject
		.src()
		.pipe(tsProject())
		.on('error', () => {})
		.pipe(gulp.dest('./built/'));
});

gulp.task('build:copy:views', () =>
	gulp.src('./src/server/web/views/**/*').pipe(gulp.dest('./built/server/web/views'))
);

gulp.task('build:copy:fonts', () =>
	gulp.src('./node_modules/three/examples/fonts/**/*').pipe(gulp.dest('./built/assets/fonts/'))
);

gulp.task('build:copy:locales', cb => {
	fs.mkdirSync('./built/assets/locales', { recursive: true });

	const v = { '_version_': meta.version };

	for (const [lang, locale] of Object.entries(locales)) {
		fs.writeFileSync(`./built/assets/locales/${lang}.${meta.version}.json`, JSON.stringify({ ...locale, ...v }), 'utf-8');
	}

	cb();
});

gulp.task('build:client:script', () => {
	return gulp.src(['./src/server/web/boot.js', './src/server/web/bios.js', './src/server/web/cli.js'])
		.pipe(replace('VERSION', JSON.stringify(meta.version)))
		.pipe(replace('LANGS', JSON.stringify(Object.keys(locales))))
		.pipe(terser({
			toplevel: true
		}))
		.pipe(gulp.dest('./built/server/web/'));
});

gulp.task('build:client:style', () => {
	return gulp.src(['./src/server/web/style.css', './src/server/web/bios.css', './src/server/web/cli.css'])
		.pipe(cssnano({
			zindex: false
		}))
		.pipe(gulp.dest('./built/server/web/'));
});

gulp.task('build:copy', gulp.parallel('build:copy:locales', 'build:copy:views', 'build:client:script', 'build:client:style', 'build:copy:fonts', () =>
	gulp.src([
		'./src/emojilist.json',
		'./src/**/assets/**/*',
		'!./src/client/assets/**/*'
	]).pipe(gulp.dest('./built/'))
));

gulp.task('clean', cb =>
	rimraf('./built', cb)
);

gulp.task('cleanall', gulp.parallel('clean', cb =>
	rimraf('./node_modules', cb)
));

gulp.task('copy:docs', () =>
		gulp.src([
			'./src/docs/**/*',
		])
		.pipe(gulp.dest('./built/assets/docs/'))
);

gulp.task('build', gulp.parallel(
	'build:ts',
	'build:copy',
	'copy:docs',
));

gulp.task('default', gulp.task('build'));

gulp.watch([
	'./src/**/*',
	'!./src/client/**/*'
], gulp.task('build'));
