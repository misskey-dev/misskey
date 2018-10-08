/**
 * Docs
 */

import * as fs from 'fs';
import * as path from 'path';
import * as showdown from 'showdown';
import 'showdown-highlightjs-extension';
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
import endpoints from '../api/endpoints';

async function genVars(lang: string): Promise<{ [key: string]: any }> {
	const vars = {} as { [key: string]: any };

	vars['lang'] = lang;

	const cwd = path.resolve(__dirname + '/../../../') + '/';

	vars['endpoints'] = endpoints;

	const entities = glob.sync('src/docs/api/entities/**/*.yaml', { cwd });
	vars['entities'] = entities.map(x => {
		const _x = yaml.safeLoad(fs.readFileSync(cwd + x, 'utf-8')) as any;
		return _x.name;
	});

	const docs = glob.sync(`src/docs/**/*.${lang}.md`, { cwd });
	vars['docs'] = {};
	docs.forEach(x => {
		const [, name] = x.match(/docs\/(.+?)\.(.+?)\.md$/);
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

const sortParams = (params: Array<{ name: string }>) => {
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
		maxage: ms('1 days')
	});
});

router.get('/*/api/endpoints/*', async ctx => {
	const lang = ctx.params[0];
	const name = ctx.params[1];
	const ep = endpoints.find(e => e.name === name);

	const vars = {
		id: `api/endpoints/${name}`,
		title: name,
		endpoint: ep.meta,
		endpointUrl: {
			host: config.api_url,
			path: name
		},
		// @ts-ignore
		params: ep.meta.params ? sortParams(Object.entries(ep.meta.params).map(([k, v]) => parseParamDefinition(k, v))) : null,
		paramDefs: ep.meta.params ? extractParamDefRef(Object.values(ep.meta.params)) : null,
		res: ep.meta.res,
		resProps: ep.meta.res && ep.meta.res.props ? sortParams(Object.entries(ep.meta.res.props).map(([k, v]) => parsePropDefinition(k, v))) : null,
		resDefs: null as any, //extractPropDefRef(Object.entries(ep.res.props).map(([k, v]) => parsePropDefinition(k, v)))
		src: `https://github.com/syuilo/misskey/tree/master/src/server/api/endpoints/${name}.ts`
	};

	await ctx.render('../../../../src/docs/api/endpoints/view', Object.assign(await genVars(lang), vars));
});

router.get('/*/api/entities/*', async ctx => {
	const lang = ctx.params[0];
	const entity = ctx.params[1];

	const x = yaml.safeLoad(fs.readFileSync(path.resolve(`${__dirname}/../../../src/docs/api/entities/${entity}.yaml`), 'utf-8')) as any;

	await ctx.render('../../../../src/docs/api/entities/view', Object.assign(await genVars(lang), {
		id: `api/entities/${entity}`,
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
		extensions: ['urlExtension', 'apiUrlExtension', 'highlightjs']
	});
	const md = fs.readFileSync(`${__dirname}/../../../src/docs/${doc}.${lang}.md`, 'utf8');

	await ctx.render('../../../../src/docs/article', Object.assign({
		id: doc,
		html: conv.makeHtml(md),
		title: md.match(/^# (.+?)\r?\n/)[1],
		src: `https://github.com/syuilo/misskey/tree/master/src/docs/${doc}.${lang}.md`
	}, await genVars(lang)));
});

export default router;
