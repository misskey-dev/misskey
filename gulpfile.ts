/**
 * Gulp tasks
 */

import * as fs from 'fs';
import * as Path from 'path';
import * as gulp from 'gulp';
import * as gutil from 'gulp-util';
import * as babel from 'gulp-babel';
import * as ts from 'gulp-typescript';
import * as tslint from 'gulp-tslint';
import * as glob from 'glob';
import * as browserify from 'browserify';
import * as source from 'vinyl-source-stream';
import * as buffer from 'vinyl-buffer';
import * as es from 'event-stream';
import stylus = require('gulp-stylus');
import cssnano = require('gulp-cssnano');
import * as uglify from 'gulp-uglify';
import ls = require('browserify-livescript');
import riotify = require('riotify');
import transformify = require('syuilo-transformify');
import pug = require('gulp-pug');
import git = require('git-last-commit');
import * as rimraf from 'rimraf';
import * as escapeHtml from 'escape-html';
import prominence = require('prominence');
import promiseify = require('promiseify');

const env = process.env.NODE_ENV;
const isProduction = env === 'production';
const isDebug = !isProduction;

if (!fs.existsSync('./.config/config.yml')) {
	console.log('npm run configを実行して設定ファイルを作成してください');
	process.exit();
}

import { IConfig } from './src/config';
const config = eval(require('typescript').transpile(require('fs').readFileSync('./src/config.ts').toString()))
	('.config/config.yml') as IConfig;

const tsProject = ts.createProject('tsconfig.json');

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

gulp.task('build:ts', () =>
	tsProject
		.src()
		.pipe(tsProject())
		.pipe(babel({
			presets: ['es2015', 'stage-3']
		}))
		.pipe(gulp.dest('./built/'))
);

gulp.task('build:about:docs', () => {
	function getLicenseHtml(path: string): string {
		return escapeHtml(fs.readFileSync(path, 'utf-8'))
			.replace(/\r\n/g, '\n')
			.replace(/(.)\n(.)/g, '$1 $2')
			.replace(/(^|\n)(.*?)($|\n)/g, '<p>$2</p>');
	}

	function getLicenseSectionHtml(path: string): string {
		try {
			const pkg = JSON.parse(fs.readFileSync(Path.parse(path).dir + '/package.json', 'utf-8'));
			const licenseHtml = getLicenseHtml(path);
			return `<details><summary>${pkg.name} <small>v${pkg.version}</small></summary>${licenseHtml}</details>`;
		} catch (e) {
			return null;
		}
	}

	const licenses = glob.sync('./node_modules/**/LICENSE*');
	const licenseHtml = getLicenseHtml('./LICENSE');
	const thirdpartyLicensesHtml = licenses.map(license => getLicenseSectionHtml(license)).join('');
	const pugs = glob.sync('./docs/**/*.pug');
	const streams = pugs.map(file => {
		const page = file.replace('./docs/', '').replace('.pug', '');
		return gulp.src(file)
			.pipe(pug({
				locals: Object.assign({
					path: page,
					license: licenseHtml,
					thirdpartyLicenses: thirdpartyLicensesHtml
				}, config)
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
		]).pipe(gulp.dest('./built/')),
		gulp.src([
			'./src/web/about/**/*',
			'!./src/web/about/**/*.pug'
		]).pipe(gulp.dest('./built/web/about/'))
	)
);

gulp.task('test', ['lint', 'build']);

gulp.task('lint', () =>
	gulp.src('./src/**/*.ts')
		.pipe(tslint({
			formatter: 'verbose'
		}))
		.pipe(tslint.report())
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
	'build:client:styles',
	'build:client:pug',
	'copy:client'
], () => {
	gutil.log('ビルドが終了しました。');

	if (isDebug) {
		gutil.log('！！！注意！！！　開発モードでのビルドです。(成果物の圧縮などはスキップされます)');
	}
});

gulp.task('build:client:scripts', async (done) => {
	// Get commit info
	const commit = await prominence(git).getLastCommit();

	// Get all app scripts
	const files = await promiseify(glob)('./src/web/app/*/script.js');

	// Compile for each scripts
	const tasks = files.map(entry => {
		let bundle =
			browserify({
				entries: [entry]
			})
			.transform(ls)
			.transform(transformify((source, file) => {
				return source
					.replace(/VERSION/g, `'${commit ? commit.hash : 'null'}'`)
					.replace(/\$theme\-color\-foreground/g, '#fff')
					.replace(/\$theme\-color/g, config.themeColor)
					.replace(/CONFIG\.theme-color/g, `'${config.themeColor}'`)
					.replace(/CONFIG\.themeColor/g, `'${config.themeColor}'`)
					.replace(/CONFIG\.api\.url/g, `'${config.scheme}://api.${config.host}'`)
					.replace(/CONFIG\.urls\.about/g, `'${config.scheme}://about.${config.host}'`)
					.replace(/CONFIG\.urls\.dev/g, `'${config.scheme}://dev.${config.host}'`)
					.replace(/CONFIG\.url/g, `'${config.url}'`)
					.replace(/CONFIG\.host/g, `'${config.host}'`)
					.replace(/CONFIG\.recaptcha\.siteKey/g, `'${config.recaptcha.siteKey}'`)
					;
			}))
			.transform(riotify, {
				type: 'livescript',
				expr: false,
				compact: true,
				parserOptions: {
					style: {
						compress: true,
						rawDefine: config
					}
				}
			})
			.bundle()
			.pipe(source(entry.replace('./src/web/app/', './').replace('.ls', '.js')));

		if (isProduction) {
			bundle = bundle
				.pipe(buffer())
				// ↓ https://github.com/mishoo/UglifyJS2/issues/448
				.pipe(babel({
					presets: ['es2015']
				}))
				.pipe(uglify({
					compress: true
				}));
		}

		return bundle
			.pipe(gulp.dest('./built/web/resources/'));
	});

	es.merge(tasks).on('end', done);
});

gulp.task('build:client:styles', () =>
	gulp.src('./src/web/app/**/*.styl')
		.pipe(stylus({
			'include css': true,
			compress: true,
			rawDefine: config
		}))
		.pipe(isProduction
			? cssnano({
				safe: true // 高度な圧縮は無効にする (一部デザインが不適切になる場合があるため)
			})
			: gutil.noop())
		.pipe(gulp.dest('./built/web/resources/'))
);

gulp.task('copy:client', [
	'build:client:scripts',
	'build:client:styles'
], () =>
	es.merge(
		gulp.src('./resources/**/*').pipe(gulp.dest('./built/web/resources/')),
		gulp.src('./src/web/resources/**/*').pipe(gulp.dest('./built/web/resources/')),
		gulp.src('./src/web/app/desktop/resources/**/*').pipe(gulp.dest('./built/web/resources/desktop/')),
		gulp.src('./src/web/app/mobile/resources/**/*').pipe(gulp.dest('./built/web/resources/mobile/')),
		gulp.src('./src/web/app/dev/resources/**/*').pipe(gulp.dest('./built/web/resources/dev/')),
		gulp.src('./src/web/app/auth/resources/**/*').pipe(gulp.dest('./built/web/resources/auth/'))
	)
);

gulp.task('build:client:pug', [
	'copy:client',
	'build:client:scripts',
	'build:client:styles'
], () =>
	gulp.src([
		'./src/web/app/*/view.pug'
	])
		.pipe(pug({
			locals: {
				themeColor: config.themeColor
			}
		}))
		.pipe(gulp.dest('./built/web/app/'))
);
