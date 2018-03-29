import * as express from 'express';
import summaly from 'summaly';

module.exports = async (req: express.Request, res: express.Response) => {
	const summary = await summaly(req.query.url);
	summary.icon = wrap(summary.icon);
	summary.thumbnail = wrap(summary.thumbnail);
	res.send(summary);
};

function wrap(url: string): string {
	return url != null
		? `https://images.weserv.nl/?url=${url.replace(/^https?:\/\//, '')}`
		: null;
}
