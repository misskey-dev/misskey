import * as Koa from 'koa';
import * as request from 'request-promise-native';
import summaly from 'summaly';
import fetchMeta from '../../misc/fetch-meta';
import Logger from '../../services/logger';

const logger = new Logger('url-preview');

module.exports = async (ctx: Koa.BaseContext) => {
	const meta = await fetchMeta();

	logger.info(meta.summalyProxy
		? `(Proxy) Getting preview of ${ctx.query.url} ...`
		: `Getting preview of ${ctx.query.url} ...`);

	try {
		const summary = meta.summalyProxy ? await request.get({
			url: meta.summalyProxy,
			qs: {
				url: ctx.query.url
			},
			json: true
		}) : await summaly(ctx.query.url, {
			followRedirects: false
		});

		logger.succ(`Got preview of ${ctx.query.url}: ${summary.title}`);

		summary.icon = wrap(summary.icon);
		summary.thumbnail = wrap(summary.thumbnail);

		// Cache 7days
		ctx.set('Cache-Control', 'max-age=604800, immutable');

		ctx.body = summary;
	} catch (e) {
		logger.error(`Failed to get preview of ${ctx.query.url}: ${e}`);
		ctx.status = 200;
		ctx.set('Cache-Control', 'max-age=86400, immutable');
		ctx.body = '{}';
	}
};

function wrap(url: string): string {
	return url != null
		? url.match(/^https?:\/\//)
			? `https://images.weserv.nl/?url=${encodeURIComponent(url.replace(/^http:\/\//, '').replace(/^https:\/\//, 'ssl:'))}&w=200&h=200`
			: url
		: null;
}
