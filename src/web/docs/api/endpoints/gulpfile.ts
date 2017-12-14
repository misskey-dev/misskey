/**
 * Gulp tasks
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import * as gulp from 'gulp';
import * as pug from 'pug';
import * as yaml from 'js-yaml';
import * as mkdirp from 'mkdirp';

import config from './../../../../conf';

const parseParam = param => {
	const id = param.type.match(/^id\((.+?)\)/);
	const object = param.type.match(/^object\((.+?)\)/);
	const isArray = /\[\]$/.test(param.type);
	if (id) {
		param.kind = 'id';
		param.type = 'string';
		param.entity = id[1];
		if (isArray) {
			param.type += '[]';
		}
	}
	if (object) {
		param.kind = 'object';
		param.type = 'object';
		param.def = object[1];
		if (isArray) {
			param.type += '[]';
		}
	}

	return param;
};

gulp.task('doc:endpoints', () => {
	glob('./src/web/docs/api/endpoints/**/*.yaml', (globErr, files) => {
		if (globErr) {
			console.error(globErr);
			return;
		}
		//console.log(files);
		files.forEach(file => {
			const ep = yaml.safeLoad(fs.readFileSync(file, 'utf-8'));
			const vars = {
				endpoint: ep.endpoint,
				url: `${config.api_url}/${ep.endpoint}`,
				desc: ep.desc,
				params: ep.params.map(p => parseParam(p)),
				paramDefs: Object.keys(ep.paramDefs).map(key => ({
					name: key,
					params: ep.paramDefs[key].map(p => parseParam(p))
				})),
				res: ep.res.map(p => parseParam(p))
			};
			pug.renderFile('./src/web/docs/api/endpoints/view.pug', vars, (renderErr, html) => {
				if (renderErr) {
					console.error(renderErr);
					return;
				}
				const htmlPath = `./built/web/docs/api/endpoints/${ep.endpoint}.html`;
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
