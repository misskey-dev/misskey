/**
 * Gulp tasks
 */

import * as fs from 'fs';
import * as Path from 'path';
import * as gulp from 'gulp';
import * as gutil from 'gulp-util';
import * as babel from 'gulp-babel';
import * as ts from 'gulp-typescript';
import tslint from 'gulp-tslint';
import * as glob from 'glob';
import * as es from 'event-stream';
import * as webpack from 'webpack-stream';
import cssnano = require('gulp-cssnano');
import * as uglify from 'gulp-uglify';
import pug = require('gulp-pug');
import * as rimraf from 'rimraf';
import * as chalk from 'chalk';
import imagemin = require('gulp-imagemin');
import * as rename from 'gulp-rename';
import * as mocha from 'gulp-mocha';

const env = process.env.NODE_ENV;
const isProduction = env === 'production';
const isDebug = !isProduction;

if (isDebug) {
	console.log(chalk.yellow.bold('！！！WARNING！！！ NODE_ENV is not "production". (built script compessing will not be performed.)'));
}

const constants = require('./src/const.json');

gulp.task('build', [
	'build:js',
	'build:ts',
	'build:about:docs',
	'build:copy',
	'build:client'
]);

gulp.task('rebuild', ['clean', 'build']);

gulp.task('build:js', () =>
	gulp.src(['./src/**/*.js', '!./src/web/**/*.js'])
		.pipe(babel({
			presets: ['es2015', 'stage-3']
		}))
		.pipe(gulp.dest('./built/'))
);

gulp.task('build:ts', () => {
	const tsProject = ts.createProject('./src/tsconfig.json');

	return tsProject
		.src()
		.pipe(tsProject())
		.pipe(gulp.dest('./built/'))
});

gulp.task('build:about:docs', () => {
	function getLicenseHtml(path: string) {
		return fs.readFileSync(path, 'utf-8')
			.replace(/\r\n/g, '\n')
			.replace(/(.)\n(.)/g, '$1 $2')
			.replace(/(^|\n)(.*?)($|\n)/g, '<p>$2</p>');
	}

	const licenseHtml = getLicenseHtml('./LICENSE');
	const streams = glob.sync('./docs/**/*.pug').map(file => {
		const page = file.replace('./docs/', '').replace('.pug', '');
		return gulp.src(file)
			.pipe(pug({
				locals: {
					path: page,
					license: licenseHtml,
					themeColor: constants.themeColor
				}
			}))
			.pipe(gulp.dest('./built/web/about/pages/' + Path.parse(page).dir));
	});

	return es.merge.apply(es, streams);
});

gulp.task('build:copy', () =>
	es.merge(
		gulp.src([
			'./src/**/resources/**/*',
			'!./src/web/app/**/resources/**/*'
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
			compilers: 'ts:ts-node/register'
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
	'build:ts', 'build:js',
	'build:client:scripts',
	'build:client:pug',
	'copy:client'
]);

gulp.task('build:client:scripts', () =>
	es.merge(
		webpack(require('./webpack.config'), require('webpack'))
			.pipe(gulp.dest('./built/web/resources/')) as any,
		gulp.src('./src/web/app/client/script.js')
			.pipe(isProduction ? uglify() : gutil.noop())
			.pipe(gulp.dest('./built/web/resources/client/')) as any
	)
);

gulp.task('build:client:styles', () =>
	gulp.src('./src/web/app/init.css')
		.pipe(isProduction
			? (cssnano as any)()
			: gutil.noop())
		.pipe(gulp.dest('./built/web/resources/'))
);

gulp.task('copy:client', [
	'build:client:scripts'
], () =>
		gulp.src([
			'./resources/**/*',
			'./src/web/resources/**/*',
			'./src/web/app/*/resources/**/*'
		])
			.pipe(isProduction ? (imagemin as any)() : gutil.noop())
			.pipe(rename(path => {
				path.dirname = path.dirname.replace('resources', '.');
			}))
			.pipe(gulp.dest('./built/web/resources/'))
);

gulp.task('build:client:pug', [
	'copy:client',
	'build:client:scripts',
	'build:client:styles'
], () =>
		gulp.src('./src/web/app/*/view.pug')
			.pipe(pug({
				locals: {
					themeColor: constants.themeColor
				}
			}))
			.pipe(gulp.dest('./built/web/app/'))
);
