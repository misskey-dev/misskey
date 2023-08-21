/**
 * Gulp tasks
 */

import * as fs from 'node:fs';
import gulp from 'gulp';
import replace from 'gulp-replace';
import terser from 'gulp-terser';
import cssnano from 'gulp-cssnano';

import locales from './locales/index.js';
import meta from './package.json' assert { type: "json" };

gulp.task('copy:backend:views', () =>
	gulp.src('./packages/backend/src/server/web/views/**/*').pipe(gulp.dest('./packages/backend/built/server/web/views'))
);

gulp.task('copy:frontend:fonts', () =>
	gulp.src('./packages/frontend/node_modules/three/examples/fonts/**/*').pipe(gulp.dest('./built/_frontend_dist_/fonts/'))
);

gulp.task('copy:frontend:tabler-icons', () =>
	gulp.src('./packages/frontend/node_modules/@tabler/icons-webfont/**/*').pipe(gulp.dest('./built/_frontend_dist_/tabler-icons/'))
);

gulp.task('copy:frontend:locales', cb => {
	fs.mkdirSync('./built/_frontend_dist_/locales', { recursive: true });

	const v = { '_version_': meta.version };

	for (const [lang, locale] of Object.entries(locales)) {
		fs.writeFileSync(`./built/_frontend_dist_/locales/${lang}.${meta.version}.json`, JSON.stringify({ ...locale, ...v }), 'utf-8');
	}

	cb();
});

gulp.task('build:backend:script', () => {
	return gulp.src(['./packages/backend/src/server/web/boot.js', './packages/backend/src/server/web/bios.js', './packages/backend/src/server/web/cli.js'])
		.pipe(replace('LANGS', JSON.stringify(Object.keys(locales))))
		.pipe(terser({
			toplevel: true
		}))
		.pipe(gulp.dest('./packages/backend/built/server/web/'));
});

gulp.task('build:backend:style', () => {
	return gulp.src(['./packages/backend/src/server/web/style.css', './packages/backend/src/server/web/bios.css', './packages/backend/src/server/web/cli.css', './packages/backend/src/server/web/error.css'])
		.pipe(cssnano({
			zindex: false
		}))
		.pipe(gulp.dest('./packages/backend/built/server/web/'));
});

gulp.task('build', gulp.parallel(
	'copy:frontend:locales', 'copy:backend:views', 'build:backend:script', 'build:backend:style', 'copy:frontend:fonts', 'copy:frontend:tabler-icons'
));

gulp.task('default', gulp.task('build'));

gulp.task('watch', () => {
	gulp.watch([
		'./packages/*/src/**/*',
	], { ignoreInitial: false }, gulp.task('build'));
});
