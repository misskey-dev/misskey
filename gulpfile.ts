/**
 * Gulp tasks
 */

import * as childProcess from 'child_process';
import * as Path from 'path';
import * as gulp from 'gulp';
import * as gutil from 'gulp-util';
import * as ts from 'gulp-typescript';
import tslint from 'gulp-tslint';
import * as es from 'event-stream';
import cssnano = require('gulp-cssnano');
import * as uglify from 'gulp-uglify';
import pug = require('gulp-pug');
import * as rimraf from 'rimraf';
import * as chalk from 'chalk';
import imagemin = require('gulp-imagemin');
import * as rename from 'gulp-rename';
import * as mocha from 'gulp-mocha';
import * as replace from 'gulp-replace';
import version from './src/version';

const env = process.env.NODE_ENV;
const isProduction = env === 'production';
const isDebug = !isProduction;

if (isDebug) {
	console.warn(chalk.yellow.bold('WARNING! NODE_ENV is not "production".'));
	console.warn(chalk.yellow.bold('         built script will not be compressed.'));
}

const constants = require('./src/const.json');

gulp.task('build', [
	'build:js',
	'build:ts',
	'build:copy',
	'build:client'
]);

gulp.task('rebuild', ['clean', 'build']);

gulp.task('build:js', () =>
	gulp.src(['./src/**/*.js', '!./src/web/**/*.js'])
		.pipe(gulp.dest('./built/'))
);

gulp.task('build:ts', () => {
	const tsProject = ts.createProject('./src/tsconfig.json');

	return tsProject
		.src()
		.pipe(tsProject())
		.pipe(gulp.dest('./built/'));
});

gulp.task('build:copy', () =>
	es.merge(
		gulp.src([
			'./src/**/assets/**/*',
			'!./src/web/app/**/assets/**/*'
		]).pipe(gulp.dest('./built/')) as any,
		gulp.src([
			'./src/web/about/**/*',
			'!./src/web/about/**/*.pug'
		]).pipe(gulp.dest('./built/web/about/')) as any
	)
);

gulp.task('test', ['lint', 'mocha']);

gulp.task('lint', () =>
	gulp.src('./src/**/*.ts')
		.pipe(tslint({
			formatter: 'verbose'
		}))
		.pipe(tslint.report())
);

gulp.task('mocha', () =>
	gulp.src([])
		.pipe(mocha({
			//compilers: 'ts:ts-node/register'
		} as any))
);

gulp.task('clean', cb =>
	rimraf('./built', cb)
);

gulp.task('cleanall', ['clean'], cb =>
	rimraf('./node_modules', cb)
);

gulp.task('default', ['build']);

gulp.task('build:client', [
	'build:ts',
	'build:js',
	'webpack',
	'build:client:script',
	'build:client:pug',
	'copy:client'
]);

gulp.task('webpack', done => {
	const output = childProcess.execSync(
		Path.join('.', 'node_modules', '.bin', 'webpack') + ' --config ./webpack/webpack.config.ts');

	console.log(output.toString());

	done();
});

gulp.task('build:client:script', () =>
	gulp.src('./src/web/app/boot.js')
		.pipe(replace('VERSION', JSON.stringify(version)))
		.pipe(isProduction ? uglify() : gutil.noop())
		.pipe(gulp.dest('./built/web/assets/client/')) as any
);

gulp.task('build:client:styles', () =>
	gulp.src('./src/web/app/init.css')
		.pipe(isProduction
			? (cssnano as any)()
			: gutil.noop())
		.pipe(gulp.dest('./built/web/assets/'))
);

gulp.task('copy:client', [
	'build:client:script',
	'webpack'
], () =>
		gulp.src([
			'./assets/**/*',
			'./src/web/assets/**/*',
			'./src/web/app/*/assets/**/*'
		])
			.pipe(isProduction ? (imagemin as any)() : gutil.noop())
			.pipe(rename(path => {
				path.dirname = path.dirname.replace('assets', '.');
			}))
			.pipe(gulp.dest('./built/web/assets/'))
);

gulp.task('build:client:pug', [
	'copy:client',
	'build:client:script',
	'build:client:styles'
], () =>
		gulp.src('./src/web/app/base.pug')
			.pipe(pug({
				locals: {
					themeColor: constants.themeColor
				}
			}))
			.pipe(gulp.dest('./built/web/app/'))
);
