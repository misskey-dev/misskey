import * as Koa from 'koa';
import summaly from 'summaly';

module.exports = async (ctx: Koa.Context) => {
	try {
		const summary = await summaly(ctx.query.url, {
			followRedirects: false
		});
		summary.icon = wrap(summary.icon);
		summary.thumbnail = wrap(summary.thumbnail);

		// Cache 7days
		ctx.set('Cache-Control', 'max-age=604800, immutable');

		ctx.body = summary;
	} catch (e) {
		ctx.status = 500;
	}
};

function wrap(url: string): string {
	return url != null
		? url.startsWith('https://') || url.startsWith('data:')
			? url
			: `https://images.weserv.nl/?url=${encodeURIComponent(url.replace(/^http:\/\//, ''))}`
		: null;
}
