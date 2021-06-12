import * as Koa from 'koa';
import * as manifest from './manifest.json';
import { fetchMeta } from '@/misc/fetch-meta';

module.exports = async (ctx: Koa.Context) => {
	const json = JSON.parse(JSON.stringify(manifest));

	const instance = await fetchMeta(true);

	json.short_name = instance.name || 'Misskey-Neko';
	json.name = instance.name || '暖ロリ猫の家';

	ctx.set('Cache-Control', 'max-age=300');
	ctx.body = json;
};
