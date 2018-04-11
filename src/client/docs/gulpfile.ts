/**
 * Gulp tasks
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import * as gulp from 'gulp';
import * as pug from 'pug';
import * as mkdirp from 'mkdirp';
import stylus = require('gulp-stylus');
import cssnano = require('gulp-cssnano');

import I18nReplacer from '../../build/i18n';
import fa from '../../build/fa';
import generateVars from './vars';

require('./api/gulpfile.ts');

gulp.task('doc', [
	'doc:docs',
	'doc:api',
	'doc:styles'
]);

gulp.task('doc:docs', async () => {
	const commonVars = await generateVars();

	glob('./src/client/docs/**/*.*.pug', (globErr, files) => {
		if (globErr) {
			console.error(globErr);
			return;
		}
		files.forEach(file => {
			const [, name, lang] = file.match(/docs\/(.+?)\.(.+?)\.pug$/);
			const vars = {
				common: commonVars,
				lang: lang,
				title: fs.readFileSync(file, 'utf-8').match(/^h1 (.+?)\r?\n/)[1],
				src: `https://github.com/syuilo/misskey/tree/master/src/client/docs/${name}.${lang}.pug`,
			};
			pug.renderFile(file, vars, (renderErr, content) => {
				if (renderErr) {
					console.error(renderErr);
					return;
				}

				pug.renderFile('./src/client/docs/layout.pug', Object.assign({}, vars, {
					content
				}), (renderErr2, html) => {
					if (renderErr2) {
						console.error(renderErr2);
						return;
					}
					const i18n = new I18nReplacer(lang);
					html = html.replace(i18n.pattern, i18n.replacement);
					html = fa(html);
					const htmlPath = `./built/client/docs/${lang}/${name}.html`;
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
});

gulp.task('doc:styles', () =>
	gulp.src('./src/client/docs/**/*.styl')
		.pipe(stylus())
		.pipe((cssnano as any)())
		.pipe(gulp.dest('./built/client/docs/assets/'))
);
