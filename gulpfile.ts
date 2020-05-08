/**
 * Gulp tasks
 */

import * as fs from 'fs';
import * as gulp from 'gulp';
import * as ts from 'gulp-typescript';
import * as rimraf from 'rimraf';
import * as rename from 'gulp-rename';
const cleanCSS = require('gulp-clean-css');
const sass = require('gulp-dart-sass');
const fiber = require('fibers');

const locales = require('./locales');
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

gulp.task('build:copy:locales', cb => {
	fs.mkdirSync('./built/client/assets/locales', { recursive: true });

	for (const [lang, locale] of Object.entries(locales)) {
		locale['_version_'] = meta.version
		fs.writeFileSync(`./built/client/assets/locales/${lang}.${meta.version}.json`, JSON.stringify(locale), 'utf-8');
	}

	cb();
});

gulp.task('build:copy', gulp.parallel('build:copy:views', 'build:copy:locales', () =>
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

gulp.task('build:client:styles', () =>
	gulp.src('./src/client/style.scss')
		.pipe(sass({ fiber }))
		.pipe(cleanCSS())
		.pipe(gulp.dest('./built/client/assets/'))
);

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
	'build:client:styles',
	'copy:client',
	'copy:docs'
));

gulp.task('build', gulp.parallel(
	'build:ts',
	'build:copy',
	'build:client',
));

gulp.task('default', gulp.task('build'));
