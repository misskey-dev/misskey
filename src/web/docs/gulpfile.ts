/**
 * Gulp tasks
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import * as gulp from 'gulp';
import * as pug from 'pug';
//import * as yaml from 'js-yaml';
import * as mkdirp from 'mkdirp';
import stylus = require('gulp-stylus');
import cssnano = require('gulp-cssnano');

//import config from './../../conf';

import generateVars from './vars';

require('./api/gulpfile.ts');

gulp.task('doc', [
	'doc:docs',
	'doc:api',
	'doc:styles'
]);

const commonVars = generateVars();

gulp.task('doc:docs', () => {
	glob('./src/web/docs/**/*.*.pug', (globErr, files) => {
		if (globErr) {
			console.error(globErr);
			return;
		}
		files.forEach(file => {
			const [, name, lang] = file.match(/docs\/(.+?)\.(.+?)\.pug$/);
			const vars = {
				common: commonVars,
				lang: lang
			};
			pug.renderFile(file, vars, (renderErr, html) => {
				if (renderErr) {
					console.error(renderErr);
					return;
				}
				const htmlPath = `./built/web/docs/${lang}/${name}.html`;
				mkdirp(path.dirname(htmlPath), (mkdirErr) => {
					if (mkdirErr) {
						console.error(mkdirErr);
						return;
					}
					fs.writeFileSync(htmlPath, html, 'utf-8');
				});
			});
		});
	});
});

gulp.task('doc:styles', () =>
	gulp.src('./src/web/docs/**/*.styl')
		.pipe(stylus())
		.pipe((cssnano as any)())
		.pipe(gulp.dest('./built/web/assets/docs/'))
);
