/**
 * Docs
 */

import * as fs from 'fs';
import * as path from 'path';
import * as showdown from 'showdown';
import ms = require('ms');
import * as Router from 'koa-router';
import * as send from 'koa-send';
import { Context, ObjectContext } from 'cafy';
import * as glob from 'glob';
import * as yaml from 'js-yaml';
import config from '../../config';
import I18n from '../../misc/i18n';
import { licenseHtml } from '../../misc/license';
const constants = require('../../const.json');

async function genVars(lang: string): Promise<{ [key: string]: any }> {
	const vars = {} as { [key: string]: any };

	vars['lang'] = lang;

	const cwd = path.resolve(__dirname + '/../../../') + '/';

	const endpoints = glob.sync('built/server/api/endpoints/**/*.js', { cwd });
	vars['endpoints'] = endpoints.map(ep => require(cwd + ep)).filter(x => x.meta).map(x => x.meta.name);

	const entities = glob.sync('src/docs/api/entities/**/*.yaml', { cwd });
	vars['entities'] = entities.map(x => {
		const _x = yaml.safeLoad(fs.readFileSync(cwd + x, 'utf-8')) as any;
		return _x.name;
	});

	const docs = glob.sync('src/docs/**/*.md', { cwd });
	vars['docs'] = {};
	docs.forEach(x => {
		const [, name, lang] = x.match(/docs\/(.+?)\.(.+?)\.md$/);
		if (vars['docs'][name] == null) {
			vars['docs'][name] = {
				name,
				title: {}
			};
		}
		vars['docs'][name]['title'][lang] = fs.readFileSync(cwd + x, 'utf-8').match(/^# (.+?)\r?\n/)[1];
	});

	vars['kebab'] = (string: string) => string.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/\s+/g, '-').toLowerCase();

	vars['config'] = config;

	vars['copyright'] = constants.copyright;

	vars['license'] = licenseHtml;

	const i18n = new I18n(lang);
	vars['i18n'] = (key: string) => i18n.get(null, key);

	return vars;
}

// WIP type
const parseParamDefinition = (key: string, param: Context) => {
	return Object.assign({
		name: key,
		type: param.getType()
	}, param.data);
};

const parsePropDefinition = (key: string, prop: any) => {
	const id = prop.type.match(/^id\((.+?)\)|^id/);
	const entity = prop.type.match(/^entity\((.+?)\)/);
	const isObject = /^object/.test(prop.type);
	const isDate = /^date/.test(prop.type);
	const isArray = /\[\]$/.test(prop.type);
	if (id) {
		prop.kind = 'id';
		prop.type = 'string';
		prop.entity = id[1];
		if (isArray) {
			prop.type += '[]';
		}
	}
	if (entity) {
		prop.kind = 'entity';
		prop.type = 'object';
		prop.entity = entity[1];
		if (isArray) {
			prop.type += '[]';
		}
	}
	if (isObject) {
		prop.kind = 'object';
		if (prop.props) {
			prop.hasDef = true;
		}
	}
	if (isDate) {
		prop.kind = 'date';
		prop.type = 'string';
		if (isArray) {
			prop.type += '[]';
		}
	}

	if (prop.optional) {
		prop.type += '?';
	}

	prop.name = key;

	return prop;
};

const sortParams = (params: Array<{name: string}>) => {
	return params;
};

// WIP type
const extractParamDefRef = (params: Context[]) => {
	let defs: any[] = [];

	params.forEach(param => {
		if (param.data && param.data.ref) {
			const props = (param as ObjectContext<any>).props;
			defs.push({
				name: param.data.ref,
				params: sortParams(Object.keys(props).map(k => parseParamDefinition(k, props[k])))
			});

			const childDefs = extractParamDefRef(Object.keys(props).map(k => props[k]));

			defs = defs.concat(childDefs);
		}
	});

	return sortParams(defs);
};

const extractPropDefRef = (props: any[]) => {
	let defs: any[] = [];

	Object.entries(props).forEach(([k, v]) => {
		if (v.props) {
			defs.push({
				name: k,
				props: sortParams(Object.entries(v.props).map(([k, v]) => parsePropDefinition(k, v)))
			});

			const childDefs = extractPropDefRef(v.props);

			defs = defs.concat(childDefs);
		}
	});

	return sortParams(defs);
};

const router = new Router();

router.get('/assets/*', async ctx => {
	await send(ctx, ctx.params[0], {
		root: `${__dirname}/../../docs/assets/`,
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
		params: sortParams(Object.entries(ep.params).map(([k, v]) => parseParamDefinition(k, v))),
		paramDefs: extractParamDefRef(Object.entries(ep.params).map(([k, v]) => v)),
		res: ep.res && ep.res.props ? sortParams(Object.entries(ep.res.props).map(([k, v]) => parsePropDefinition(k, v))) : null,
		resDefs: null//extractPropDefRef(Object.entries(ep.res.props).map(([k, v]) => parsePropDefinition(k, v)))
	};

	await ctx.render('../../../../src/docs/api/endpoints/view', Object.assign(await genVars(lang), vars));
});

router.get('/*/api/entities/*', async ctx => {
	const lang = ctx.params[0];
	const entity = ctx.params[1];

	const x = yaml.safeLoad(fs.readFileSync(path.resolve(__dirname + '/../../../src/docs/api/entities/' + entity + '.yaml'), 'utf-8')) as any;

	await ctx.render('../../../../src/docs/api/entities/view', Object.assign(await genVars(lang), {
		name: x.name,
		desc: x.desc,
		props: sortParams(Object.entries(x.props).map(([k, v]) => parsePropDefinition(k, v))),
		propDefs: extractPropDefRef(x.props)
	}));
});

router.get('/*/*', async ctx => {
	const lang = ctx.params[0];
	const doc = ctx.params[1];

	showdown.extension('urlExtension', () => ({
		type: 'output',
		regex: /%URL%/g,
		replace: config.url
	}));

	showdown.extension('apiUrlExtension', () => ({
		type: 'output',
		regex: /%API_URL%/g,
		replace: config.api_url
	}));

	const conv = new showdown.Converter({
		tables: true,
		extensions: ['urlExtension', 'apiUrlExtension']
	});
	const md = fs.readFileSync(`${__dirname}/../../../src/docs/${doc}.${lang}.md`, 'utf8');

	await ctx.render('../../../../src/docs/article', Object.assign({
		html: conv.makeHtml(md)
	}, await genVars(lang)));
});

export default router;
