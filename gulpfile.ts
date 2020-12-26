/**
 * Gulp tasks
 */

import * as fs from 'fs';
import * as gulp from 'gulp';
import * as ts from 'gulp-typescript';
import * as rimraf from 'rimraf';
import * as rename from 'gulp-rename';
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
	gulp.src('./node_modules/three/examples/fonts/**/*').pipe(gulp.dest('./built/client/assets/fonts/'))
);

gulp.task('build:copy:locales', cb => {
	fs.mkdirSync('./built/client/assets/locales', { recursive: true });

	const v = { '_version_': meta.version };

	for (const [lang, locale] of Object.entries(locales)) {
		fs.writeFileSync(`./built/client/assets/locales/${lang}.${meta.version}.json`, JSON.stringify({ ...locale, ...v }), 'utf-8');
	}

	cb();
});

gulp.task('build:client:script', () => {
	return gulp.src(['./src/server/web/boot.js'])
		.pipe(replace('VERSION', JSON.stringify(meta.version)))
		.pipe(replace('LANGS', JSON.stringify(Object.keys(locales))))
		.pipe(terser({
			toplevel: true
		}))
		.pipe(gulp.dest('./built/server/web/'));
});

gulp.task('build:client:style', () => {
	return gulp.src(['./src/server/web/style.css'])
		.pipe(cssnano())
		.pipe(gulp.dest('./built/server/web/'));
});

gulp.task('build:copy', gulp.parallel('build:copy:locales', 'build:copy:views', 'build:client:script', 'build:client:style', 'build:copy:fonts', () =>
	gulp.src([
		'./src/emojilist.json',
		'./src/server/web/views/**/*',
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

gulp.task('copy:client', () =>
		gulp.src([
			'./assets/**/*',
			'./src/client/assets/**/*',
		])
			.pipe(rename(path => {
				path.dirname = path.dirname!.replace('assets', '.');
			}))
			.pipe(gulp.dest('./built/client/assets/'))
);

gulp.task('copy:docs', () =>
		gulp.src([
			'./src/docs/**/*',
		])
		.pipe(gulp.dest('./built/client/assets/docs/'))
);

gulp.task('build:client', gulp.parallel(
	'copy:client',
	'copy:docs'
));

gulp.task('build', gulp.parallel(
	'build:ts',
	'build:copy',
	'build:client',
));

gulp.task('default', gulp.task('build'));
