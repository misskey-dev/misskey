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
const stylus = require('gulp-stylus');
const cssnano = require('gulp-cssnano');
import * as uglify from 'gulp-uglify';
const ls = require('browserify-livescript');
const aliasify = require('aliasify');
const riotify = require('riotify');
const transformify = require('syuilo-transformify');
const pug = require('gulp-pug');
const git = require('git-last-commit');
import * as rimraf from 'rimraf';
import * as escapeHtml from 'escape-html';

const env = process.env.NODE_ENV;
const isProduction = env === 'production';
const isDebug = !isProduction;

if (!fs.existsSync('./.config/config.yml')) {
	console.log('設定ファイルが見つかりません。npm run configしてください');
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

gulp.task('build:about:docs', () => {
	const licenses = glob.sync('./node_modules/**/LICENSE*');
	const licenseHtml = getLicenseHtml('./LICENSE');
	const thirdpartyLicensesHtml = licenses.map(license => getLicenseSectionHtml(license)).join('');
	const pugs = glob.sync('./src/web/about/pages/**/*.pug');
	const streams = pugs.map(file => {
		const page = file.replace('./src/web/about/pages/', '').replace('.pug', '');
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

const aliasifyConfig = {
	aliases: {
		'fetch': './node_modules/whatwg-fetch/fetch.js',
		'page': './node_modules/page/page.js',
		'NProgress': './node_modules/nprogress/nprogress.js',
		'velocity': './node_modules/velocity-animate/velocity.js',
		'chart.js': './node_modules/chart.js/src/chart.js',
		'textarea-caret-position': './node_modules/textarea-caret/index.js',
		'misskey-text': './src/common/text/index.js',
		'strength.js': './node_modules/syuilo-password-strength/strength.js',
		'cropper': './node_modules/cropperjs/dist/cropper.js',
		'Sortable': './node_modules/sortablejs/Sortable.js',
		'fuck-adblock': './node_modules/fuckadblock/fuckadblock.js',
		'reconnecting-websocket': './node_modules/reconnecting-websocket/dist/index.js'
	},
	appliesTo: {
		'includeExtensions': ['.js', '.ls']
	}
};

gulp.task('build:client', [
	'build:ts', 'build:js',
	'build:client:scripts',
	'build:client:styles',
	'build:client:pug',
	'copy:client'
], () => {
	gutil.log('ビルドが終了しました。');

	if (isDebug) {
		gutil.log('■　注意！　開発モードでのビルドです。');
	}
});

gulp.task('build:client:scripts', done => {
	gutil.log('スクリプトを構築します...');

	// Get commit info
	git.getLastCommit((err, commit) => {
		glob('./src/web/app/*/script.js', (err, files) => {
			const tasks = files.map(entry => {
				let bundle =
					browserify({
						entries: [entry]
					})
					.transform(ls)
					.transform(aliasify, aliasifyConfig)

					.transform(transformify((source, file) => {
						if (file.substr(-4) !== '.tag') return source;
						gutil.log('Build Tag: ' + file);
						return source;
					}))

					// tagの{}の''を不要にする (その代わりスタイルの記法は使えなくなるけど)
					.transform(transformify((source, file) => {
						if (file.substr(-4) !== '.tag') return source;

						const tag = new Tag(source);
						const html = tag.sections.filter(s => s.name == 'html')[0];

						html.lines = html.lines.map(line => {
							if (line.replace(/\t/g, '')[0] === '|') {
								return line;
							} else {
								return line.replace(/([+=])\s?\{(.+?)\}/g, '$1"{$2}"');
							}
						});

						const styles = tag.sections.filter(s => s.name == 'style');

						if (styles.length == 0) {
							return tag.compile();
						}

						styles.forEach(style => {
							let head = style.lines.shift();
							head = head.replace(/([+=])\s?\{(.+?)\}/g, '$1"{$2}"');
							style.lines.unshift(head);
						});

						return tag.compile();
					}))

					// tagの@hogeをref='hoge'にする
					.transform(transformify((source, file) => {
						if (file.substr(-4) !== '.tag') return source;

						const tag = new Tag(source);
						const html = tag.sections.filter(s => s.name == 'html')[0];

						html.lines = html.lines.map(line => {
							if (line.indexOf('@') === -1) {
								return line;
							} else if (line.replace(/\t/g, '')[0] === '|') {
								return line;
							} else {
								while (line.match(/[^\s']@[a-z-]+/) !== null) {
									const match = line.match(/@[a-z-]+/);
									let name = match[0];
									if (line[line.indexOf(name) + name.length] === '(') {
										line = line.replace(name + '(', '(ref=\'' + camelCase(name.substr(1)) + '\',');
									} else {
										line = line.replace(name, '(ref=\'' + camelCase(name.substr(1)) + '\')');
									}
								}
								return line;
							}
						});

						return tag.compile();

						function camelCase(str): string {
							return str.replace(/-([^\s])/g, (match, group1) => {
								return group1.toUpperCase();
							});
						}
					}))

					// tagのchain-caseをcamelCaseにする
					.transform(transformify((source, file) => {
						if (file.substr(-4) !== '.tag') return source;

						const tag = new Tag(source);
						const html = tag.sections.filter(s => s.name == 'html')[0];

						html.lines = html.lines.map(line => {
							(line.match(/\{.+?\}/g) || []).forEach(x => {
								line = line.replace(x, camelCase(x));
							});
							return line;
						});

						return tag.compile();

						function camelCase(str): string {
							str = str.replace(/([a-z\-]+):/g, (match, group1) => {
								return group1.replace(/\-/g, '###') + ':';
							});
							str = str.replace(/'(.+?)'/g, (match, group1) => {
								return "'" + group1.replace(/\-/g, '###') + "'";
							});
							str = str.replace(/-([^\s0-9])/g, (match, group1) => {
								return group1.toUpperCase();
							});
							str = str.replace(/###/g, '-');

							return str;
						}
					}))

					// tagのstyleの属性
					.transform(transformify((source, file) => {
						if (file.substr(-4) !== '.tag') return source;

						const tag = new Tag(source);

						const styles = tag.sections.filter(s => s.name == 'style');

						if (styles.length == 0) {
							return tag.compile();
						}

						styles.forEach(style => {
							let head = style.lines.shift();
							if (style.attr) {
								style.attr = style.attr + ', type=\'stylus\', scoped';
							} else {
								style.attr = 'type=\'stylus\', scoped';
							}
							style.lines.unshift(head);
						});

						return tag.compile();
					}))

					// tagのstyleの定数
					.transform(transformify((source, file) => {
						if (file.substr(-4) !== '.tag') return source;

						const tag = new Tag(source);

						const styles = tag.sections.filter(s => s.name == 'style');

						if (styles.length == 0) {
							return tag.compile();
						}

						styles.forEach(style => {
							const head = style.lines.shift();
							style.lines.unshift('$theme-color = ' + config.themeColor);
							style.lines.unshift('$theme-color-foreground = #fff');
							style.lines.unshift(head);
						});

						return tag.compile();
					}))

					// tagのstyleを暗黙的に:scopeにする
					.transform(transformify((source, file) => {
						if (file.substr(-4) !== '.tag') return source;

						const tag = new Tag(source);

						const styles = tag.sections.filter(s => s.name == 'style');

						if (styles.length == 0) {
							return tag.compile();
						}

						styles.forEach((style, i) => {
							if (i != 0) {
								return;
							}
							const head = style.lines.shift();
							style.lines = style.lines.map(line => {
								return '\t' + line;
							});
							style.lines.unshift(':scope');
							style.lines.unshift(head);
						});

						return tag.compile();
					}))

					// tagのtheme styleのパース
					.transform(transformify((source, file) => {
						if (file.substr(-4) !== '.tag') return source;

						const tag = new Tag(source);

						const styles = tag.sections.filter(s => s.name == 'style');

						if (styles.length == 0) {
							return tag.compile();
						}

						styles.forEach((style, i) => {
							if (i == 0) {
								return;
							} else if (style.attr.substr(0, 6) != 'theme=') {
								return;
							}
							const head = style.lines.shift();
							style.lines = style.lines.map(line => {
								return '\t' + line;
							});
							style.lines.unshift(':scope');
							style.lines = style.lines.map(line => {
								return '\t' + line;
							});
							style.lines.unshift('html[data-' + style.attr.match(/theme='(.+?)'/)[0] + ']');
							style.lines.unshift(head);
						});

						return tag.compile();
					}))

					// tagのstyleおよびscriptのインデントを不要にする
					.transform(transformify((source, file) => {
						if (file.substr(-4) !== '.tag') return source;
						const tag = new Tag(source);

						tag.sections = tag.sections.map(section => {
							if (section.name != 'html') {
								section.indent++;
							}
							return section;
						});

						return tag.compile();
					}))

					// スペースでインデントされてないとエラーが出る
					.transform(transformify((source, file) => {
						if (file.substr(-4) !== '.tag') return source;
						return source.replace(/\t/g, '  ');
					}))

					.transform(transformify((source, file) => {
						return source
							.replace(/VERSION/g, `'${commit ? commit.hash : 'null'}'`)
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
						template: 'pug',
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
					// Riotが謎の空白を挿入する
					.transform(transformify((source, file) => {
						if (file.substr(-4) !== '.tag') return source;
						return source.replace(/\s<mk\-ellipsis>/g, '<mk-ellipsis>');
					}))
					/*
					// LiveScruptがHTMLクラスのショートカットを変な風に生成するのでそれを修正
					.transform(transformify((source, file) => {
						if (file.substr(-4) !== '.tag') return source;
						return source.replace(/class="\{\(\{(.+?)\}\)\}"/g, 'class="{$1}"');
					}))*/
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
	});
});

gulp.task('build:client:styles', () => {
	gutil.log('フロントサイドスタイルを構築します...');

	return gulp.src('./src/web/app/**/*.styl')
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
		.pipe(gulp.dest('./built/web/resources/'));
});

gulp.task('copy:client', [
	'build:client:scripts',
	'build:client:styles'
], () => {
	gutil.log('必要なリソースをコピーします...');

	return es.merge(
		gulp.src('./resources/**/*').pipe(gulp.dest('./built/web/resources/')),
		gulp.src('./src/web/resources/**/*').pipe(gulp.dest('./built/web/resources/')),
		gulp.src('./src/web/app/desktop/resources/**/*').pipe(gulp.dest('./built/web/resources/desktop/')),
		gulp.src('./src/web/app/mobile/resources/**/*').pipe(gulp.dest('./built/web/resources/mobile/')),
		gulp.src('./src/web/app/dev/resources/**/*').pipe(gulp.dest('./built/web/resources/dev/')),
		gulp.src('./src/web/app/auth/resources/**/*').pipe(gulp.dest('./built/web/resources/auth/'))
	);
});

gulp.task('build:client:pug', [
	'copy:client',
	'build:client:scripts',
	'build:client:styles'
], () => {
	gutil.log('Pugをコンパイルします...');

	return gulp.src([
		'./src/web/app/*/view.pug'
	])
		.pipe(pug({
			locals: {
				themeColor: config.themeColor
			}
		}))
		.pipe(gulp.dest('./built/web/app/'));
});

class Tag {
	sections: {
		name: string;
		attr?: string;
		indent: number;
		lines: string[];
	}[];

	constructor(source) {
		this.sections = [];

		source = source
			.replace(/\r\n/g, '\n')
			.replace(/\n(\t+?)\n/g, '\n')
			.replace(/\n+/g, '\n');

		const html = {
			name: 'html',
			indent: 0,
			lines: []
		};

		let flag = false;
		source.split('\n').forEach((line, i) => {
			const indent = line.lastIndexOf('\t') + 1;
			if (i != 0 && indent == 0) {
				flag = true;
			}
			if (!flag) {
				source = source.replace(/^.*?\n/, '');
				html.lines.push(i == 0 ? line : line.substr(1));
			}
		});

		this.sections.push(html);

		while (source != '') {
			const line = source.substr(0, source.indexOf('\n'));
			const root = line.match(/^\t*([a-z]+)(\.|\()?/)[1];
			const beginIndent = line.lastIndexOf('\t') + 1;
			flag = false;
			const section = {
				name: root,
				attr: (line.match(/\((.+?)\)/) || [null, null])[1],
				indent: beginIndent,
				lines: []
			};
			source.split('\n').forEach((line, i) => {
				const currentIndent = line.lastIndexOf('\t') + 1;
				if (i != 0 && (currentIndent == beginIndent || currentIndent == 0)) {
					flag = true;
				}
				if (!flag) {
					if (i == 0 && line[line.length - 1] == '.') {
						line = line.substr(0, line.length - 1);
					}
					if (i == 0 && line.indexOf('(') != -1) {
						line = line.substr(0, line.indexOf('('));
					}
					source = source.replace(/^.*?\n/, '');
					section.lines.push(i == 0 ? line.substr(beginIndent) : line.substr(beginIndent + 1));
				}
			});
			this.sections.push(section);
		}
	}

	compile(): string {
		let dist = '';
		this.sections.forEach((section, j) => {
			dist += section.lines.map((line, i) => {
				if (i == 0) {
					const attr = section.attr != null ? '(' + section.attr + ')' : '';
					const tail = j != 0 ? '.' : '';
					return '\t'.repeat(section.indent) + line + attr + tail;
				} else {
					return '\t'.repeat(section.indent + 1) + line;
				}
			}).join('\n') + '\n';
		});
		return dist;
	}
}
