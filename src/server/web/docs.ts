/**
 * Docs
 */

import ms = require('ms');
import * as Router from 'koa-router';
import * as send from 'koa-send';
import { Context } from 'cafy';
import ObjectContext from 'cafy/built/types/object';
import config from '../../config';
import generateVars from '../../client/docs/vars';

const docs = `${__dirname}/../../client/docs/`;

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

const router = new Router();

router.get('/assets/*', async ctx => {
	await send(ctx, ctx.params[0], {
		root: docs + '/assets/',
		maxage: ms('7 days'),
		immutable: true
	});
});

router.get('/*/api/endpoints/*', async ctx => {
	const ep = require('../../../built/server/api/endpoints/' + ctx.params[1]).meta;

	const vars = {
		endpoint: ep.name,
		url: {
			host: config.api_url,
			path: ep.name
		},
		desc: ep.desc,
		// @ts-ignore
		params: sortParams(Object.keys(ep.params).map(k => parseEPDefParam(k, ep.params[k]))),
		paramDefs: extractDefs(Object.keys(ep.params).map(k => ep.params[k])),
	};
	console.log(vars);

	const commonVars = await generateVars();

	await ctx.render('../../../../src/client/docs/api/endpoints/view', Object.assign({}, vars, {
		lang: 'ja',
		title: ep.name,
		kebab: (string: string) => string.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/\s+/g, '-').toLowerCase(),
		common: commonVars
	}));
});

router.get('*', async ctx => {
	await send(ctx, `${ctx.params[0]}.html`, {
		root: docs
	});
});

export default router;
