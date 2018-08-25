import * as Koa from 'koa';
import * as request from 'request-promise-native';
import summaly from 'summaly';
import config from '../../config';

module.exports = async (ctx: Koa.Context) => {
	try {
		const summary = config.summalyProxy ? await request.get({
			url: config.summalyProxy,
			qs: {
				url: ctx.query.url
			},
			json: true
		}) : await summaly(ctx.query.url, {
			followRedirects: false
		});

		summary.icon = wrap(summary.icon);
		summary.thumbnail = wrap(summary.thumbnail);

		// Cache 7days
		ctx.set('Cache-Control', 'max-age=604800, immutable');

		ctx.body = summary;
	} catch (e) {
		ctx.status = 200;
		ctx.set('Cache-Control', 'max-age=86400, immutable');
		ctx.body = '{}';
	}
};

function wrap(url: string): string {
	return url != null
		? url.startsWith('https://') || url.startsWith('data:')
			? url
			: `https://images.weserv.nl/?url=${encodeURIComponent(url.replace(/^http:\/\//, ''))}`
		: null;
}
