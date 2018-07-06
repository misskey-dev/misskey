/**
 * Gulp tasks
 */

import * as gulp from 'gulp';
const stylus = require('gulp-stylus');
const cssnano = require('gulp-cssnano');

gulp.task('doc', [
	'doc:styles'
]);

gulp.task('doc:styles', () =>
	gulp.src('./src/client/docs/**/*.styl')
		.pipe(stylus())
		.pipe((cssnano as any)())
		.pipe(gulp.dest('./built/client/docs/assets/'))
);
