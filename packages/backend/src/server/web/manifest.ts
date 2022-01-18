import * as Koa from 'koa';
import * as manifest from './manifest.json';
import { fetchMeta } from '@/misc/fetch-meta';
import * as useragent from 'express-useragent';

module.exports = async (ctx: Koa.Context) => {
	const json = JSON.parse(JSON.stringify(manifest));

	const instance = await fetchMeta(true);

	json.short_name = instance.name || 'Misskey';
	json.name = instance.name || 'Misskey';

	const source = ctx.header['user-agent'] || '';
	const ua = useragent.parse(source);
	if (ua.isDesktop) {
		json.display = 'minimal-ui';
	}

	ctx.body = json;
};
