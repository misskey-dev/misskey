import * as Koa from 'koa';
import summaly from 'summaly';

module.exports = async (ctx: Koa.Context) => {
	const summary = await summaly(ctx.query.url);
	summary.icon = wrap(summary.icon);
	summary.thumbnail = wrap(summary.thumbnail);

	// Cache 7days
	ctx.set('Cache-Control', 'max-age=604800, immutable');

	ctx.body = summary;
};

function wrap(url: string): string {
	return url != null
		? `https://images.weserv.nl/?url=${url.replace(/^https?:\/\//, '')}`
		: null;
}
