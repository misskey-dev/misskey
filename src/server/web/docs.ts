/**
 * Docs
 */

import * as fs from 'fs';
import * as path from 'path';
import ms = require('ms');
import * as Router from 'koa-router';
import * as send from 'koa-send';
import { Context } from 'cafy';
import * as glob from 'glob';
import * as yaml from 'js-yaml';
import ObjectContext from 'cafy/built/types/object';
import config from '../../config';
import I18n from '../../build/i18n';
import { fa } from '../../build/fa';
import { licenseHtml } from '../../build/license';
const constants = require('../../const.json');

const docs = `${__dirname}/../../client/docs/`;

async function genVars(lang: string): Promise<{ [key: string]: any }> {
	const vars = {} as { [key: string]: any };

	vars['lang'] = lang;

	const endpoints = glob.sync('./built/server/api/endpoints/**/*.js');
	vars['endpoints'] = endpoints.map(ep => require('../../../' + ep)).filter(x => x.meta).map(x => x.meta.name);

	const entities = glob.sync('./src/client/docs/api/entities/**/*.yaml');
	vars['entities'] = entities.map(x => {
		const _x = yaml.safeLoad(fs.readFileSync(x, 'utf-8')) as any;
		return _x.name;
	});

	const docs = glob.sync('./src/client/docs/**/*.*.pug');
	vars['docs'] = {};
	docs.forEach(x => {
		const [, name, lang] = x.match(/docs\/(.+?)\.(.+?)\.pug$/);
		if (vars['docs'][name] == null) {
			vars['docs'][name] = {
				name,
				title: {}
			};
		}
		vars['docs'][name]['title'][lang] = fs.readFileSync(x, 'utf-8').match(/^h1 (.+?)\r?\n/)[1];
	});

	vars['kebab'] = (string: string) => string.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/\s+/g, '-').toLowerCase();

	vars['config'] = config;

	vars['copyright'] = constants.copyright;

	vars['facss'] = fa.dom.css();

	vars['license'] = licenseHtml;

	const i18n = new I18n(lang);
	vars['i18n'] = (key: string) => i18n.get(null, key);

	return vars;
}

// WIP type
const parseEPDefParam = (key: string, param: Context) => {
	return Object.assign({
		name: key,
		type: param.getType()
	}, param.data);
};

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

	if (param.optional) {
		param.type += '?';
	}

	return param;
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
const extractEPDefs = (params: Context[]) => {
	let defs: any[] = [];

	params.forEach(param => {
		if (param.data && param.data.ref) {
			const props = (param as ObjectContext<any>).props;
			defs.push({
				name: param.data.ref,
				params: sortParams(Object.keys(props).map(k => parseEPDefParam(k, props[k])))
			});

			const childDefs = extractEPDefs(Object.keys(props).map(k => props[k]));

			defs = defs.concat(childDefs);
		}
	});

	return sortParams(defs);
};

const extractDefs = (params: any[]) => {
	let defs: any[] = [];

	params.forEach(param => {
		if (param.def) {
			defs.push({
				name: param.defName,
				params: sortParams(param.def.map((p: any) => parseParam(p)))
			});

			const childDefs = extractDefs(param.def);

			defs = defs.concat(childDefs);
		}
	});

	return sortParams(defs);
};

const router = new Router();

router.get('/assets/*', async ctx => {
	await send(ctx, ctx.params[0], {
		root: docs + '/assets/',
		maxage: ms('7 days'),
		immutable: true
	});
});

router.get('/*/api/endpoints/*', async ctx => {
	const lang = ctx.params[0];
	const ep = require('../../../built/server/api/endpoints/' + ctx.params[1]).meta;

	const vars = {
		title: ep.name,
		endpoint: ep.name,
		url: {
			host: config.api_url,
			path: ep.name
		},
		desc: ep.desc,
		// @ts-ignore
		params: sortParams(Object.keys(ep.params).map(k => parseEPDefParam(k, ep.params[k]))),
		paramDefs: extractEPDefs(Object.keys(ep.params).map(k => ep.params[k])),
	};

	await ctx.render('../../../../src/client/docs/api/endpoints/view', Object.assign(await genVars(lang), vars));
});

router.get('/*/api/entities/*', async ctx => {
	const lang = ctx.params[0];
	const entity = ctx.params[1];

	const x = yaml.safeLoad(fs.readFileSync(path.resolve('./src/client/docs/api/entities/' + entity + '.yaml'), 'utf-8')) as any;

	await ctx.render('../../../../src/client/docs/api/entities/view', Object.assign(await genVars(lang), {
		name: x.name,
		desc: x.desc,
		props: sortParams(x.props.map((p: any) => parseParam(p))),
		propDefs: extractDefs(x.props)
	}));
});

router.get('/*/*', async ctx => {
	const lang = ctx.params[0];
	const doc = ctx.params[1];

	await ctx.render('../../../../src/client/docs/' + doc + '.' + lang, await genVars(lang));
});

export default router;
