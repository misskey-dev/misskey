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

import locales from '../../../../locales';
import I18nReplacer from '../../../build/i18n';
import fa from '../../../build/fa';
import config from './../../../conf';

import generateVars from '../vars';

const langs = Object.keys(locales);

const kebab = string => string.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/\s+/g, '-').toLowerCase();

const parseParam = param => {
	const id = param.type.match(/^id\((.+?)\)|^id/);
	const entity = param.type.match(/^entity\((.+?)\)/);
	const isObject = /^object/.test(param.type);
	const isDate = /^date/.test(param.type);
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
	if (isDate) {
		param.kind = 'date';
		param.type = 'string';
		if (isArray) {
			param.type += '[]';
		}
	}

	return param;
};

const sortParams = params => {
	params.sort((a, b) => {
		if (a.name < b.name)
			return -1;
		if (a.name > b.name)
			return 1;
		return 0;
	});
	return params;
};

const extractDefs = params => {
	let defs = [];

	params.forEach(param => {
		if (param.def) {
			defs.push({
				name: param.defName,
				params: sortParams(param.def.map(p => parseParam(p)))
			});

			const childDefs = extractDefs(param.def);

			defs = defs.concat(childDefs);
		}
	});

	return sortParams(defs);
};

gulp.task('doc:api', [
	'doc:api:endpoints',
	'doc:api:entities'
]);

gulp.task('doc:api:endpoints', async () => {
	const commonVars = await generateVars();
	glob('./src/client/docs/api/endpoints/**/*.yaml', (globErr, files) => {
		if (globErr) {
			console.error(globErr);
			return;
		}
		//console.log(files);
		files.forEach(file => {
			const ep: any = yaml.safeLoad(fs.readFileSync(file, 'utf-8'));
			const vars = {
				endpoint: ep.endpoint,
				url: {
					host: config.api_url,
					path: ep.endpoint
				},
				desc: ep.desc,
				params: sortParams(ep.params.map(p => parseParam(p))),
				paramDefs: extractDefs(ep.params),
				res: ep.res ? sortParams(ep.res.map(p => parseParam(p))) : null,
				resDefs: ep.res ? extractDefs(ep.res) : null,
			};
			langs.forEach(lang => {
				pug.renderFile('./src/client/docs/api/endpoints/view.pug', Object.assign({}, vars, {
					lang,
					title: ep.endpoint,
					src: `https://github.com/syuilo/misskey/tree/master/src/client/docs/api/endpoints/${ep.endpoint}.yaml`,
					kebab,
					common: commonVars
				}), (renderErr, html) => {
					if (renderErr) {
						console.error(renderErr);
						return;
					}
					const i18n = new I18nReplacer(lang);
					html = html.replace(i18n.pattern, i18n.replacement);
					html = fa(html);
					const htmlPath = `./built/client/docs/${lang}/api/endpoints/${ep.endpoint}.html`;
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

gulp.task('doc:api:entities', async () => {
	const commonVars = await generateVars();
	glob('./src/client/docs/api/entities/**/*.yaml', (globErr, files) => {
		if (globErr) {
			console.error(globErr);
			return;
		}
		files.forEach(file => {
			const entity = yaml.safeLoad(fs.readFileSync(file, 'utf-8'));
			const vars = {
				name: entity.name,
				desc: entity.desc,
				props: sortParams(entity.props.map(p => parseParam(p))),
				propDefs: extractDefs(entity.props),
			};
			langs.forEach(lang => {
				pug.renderFile('./src/client/docs/api/entities/view.pug', Object.assign({}, vars, {
					lang,
					title: entity.name,
					src: `https://github.com/syuilo/misskey/tree/master/src/client/docs/api/entities/${kebab(entity.name)}.yaml`,
					kebab,
					common: commonVars
				}), (renderErr, html) => {
					if (renderErr) {
						console.error(renderErr);
						return;
					}
					const i18n = new I18nReplacer(lang);
					html = html.replace(i18n.pattern, i18n.replacement);
					html = fa(html);
					const htmlPath = `./built/client/docs/${lang}/api/entities/${kebab(entity.name)}.html`;
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
