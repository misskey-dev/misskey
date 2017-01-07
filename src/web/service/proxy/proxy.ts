import * as url from 'url';
import * as express from 'express';
import * as request from 'request';

module.exports = (req: express.Request, res: express.Response) => {
	const _url = req.params.url;

	if (!_url) {
		return;
	}

	request({
		url: _url + (url.parse(req.url, true).search || ''),
		encoding: null
	}, (err, response, content) => {
		if (err) {
			console.error(err);
			return;
		}

		const contentType = response.headers['content-type'];

		if (/^text\//.test(contentType) || contentType === 'application/javascript') {
			content = content.toString().replace(/http:\/\//g, `${config.secondary_scheme}://proxy.${config.secondary_host}/http://`);
		}

		res.header('Content-Type', contentType);
		res.send(content);
	});
};
