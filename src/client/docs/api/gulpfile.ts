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
import config from './../../../config';

import generateVars from '../vars';
import { Context } from 'cafy';
import ObjectContext from 'cafy/built/types/object';

const langs = Object.keys(locales);

const kebab = (string: string) => string.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/\s+/g, '-').toLowerCase();

const parseParam = (param: any) => {
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

// WIP type
const parseEPDefParam = (key: string, param: Context) => {
	return Object.assign({
		name: key,
		type: param.getType()
	}, param.data);
};

const sortParams = (params: Array<{name: string}>) => {
	params.sort((a, b) => {
		if (a.name < b.name)
			return -1;
		if (a.name > b.name)
			return 1;
		return 0;
	});
	return params;
};

// WIP type
const extractDefs = (params: Context[]) => {
	let defs: any[] = [];

	params.forEach(param => {
		if (param.data && param.data.ref) {
			const props = (param as ObjectContext<any>).props;
			defs.push({
				name: param.data.ref,
				params: sortParams(Object.keys(props).map(k => parseEPDefParam(k, props[k])))
			});

			const childDefs = extractDefs(Object.keys(props).map(k => props[k]));

			defs = defs.concat(childDefs);
		}
	});

	return sortParams(defs);
};

gulp.task('doc:api', [
	'doc:api:endpoints',
	'doc:api:entities'
]);

gulp.task('doc:api:endpoints', ['build:ts'], async () => {
	const commonVars = await generateVars();
	glob('./built/server/api/endpoints/**/*.js', (globErr, files) => {
		if (globErr) {
			console.error(globErr);
			return;
		}
		console.log(files.map(file => require('../../../../' + file)));

		files.map(file => require('../../../../' + file)).filter(x => x.meta).map(x => x.meta).forEach(ep => {
			console.log(ep);
			const vars = {
				endpoint: ep.name,
				url: {
					host: config.api_url,
					path: ep.name
				},
				desc: ep.desc,
				// @ts-ignore
				params: sortParams(ep.params.map(p => parseEPDefParam(p))),
				paramDefs: extractDefs(ep.params),
			};
			langs.forEach(lang => {
				pug.renderFile('./src/client/docs/api/endpoints/view.pug', Object.assign({}, vars, {
					lang,
					title: ep.name,
					src: `https://github.com/syuilo/misskey/tree/master/src/client/docs/api/endpoints/${ep.name}.yaml`,
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
					const htmlPath = `./built/client/docs/${lang}/api/endpoints/${ep.name}.html`;
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
			const entity = yaml.safeLoad(fs.readFileSync(file, 'utf-8')) as any;
			const vars = {
				name: entity.name,
				desc: entity.desc,
				// WIP type
				props: sortParams(entity.props.map((p: any) => parseParam(p))),
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
