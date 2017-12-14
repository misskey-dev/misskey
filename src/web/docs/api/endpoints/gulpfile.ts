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
	const entity = param.type.match(/^entity\((.+?)\)/);
	const isObject = /^object/.test(param.type);
	const isArray = /\[\]$/.test(param.type);
	if (id) {
		param.kind = 'id';
		param.type = 'string';
		param.entity = id[1];
		if (isArray) {
			param.type += '[]';
		}
	}
	if (entity) {
		param.kind = 'entity';
		param.type = 'object';
		param.entity = entity[1];
		if (isArray) {
			param.type += '[]';
		}
	}
	if (isObject) {
		param.kind = 'object';
	}

	return param;
};

const extractDefs = params => {
	const defs = [];

	params.forEach(param => {
		if (param.def) {
			defs.push({
				name: param.defName,
				params: param.def.map(p => parseParam(p))
			});

			const childDefs = extractDefs(param.def);

			defs.concat(childDefs);
		}
	});

	return defs;
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
				paramDefs: extractDefs(ep.params),
				res: ep.res.map(p => parseParam(p)),
				resDefs: extractDefs(ep.res)
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
