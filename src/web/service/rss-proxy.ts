import * as express from 'express';
import * as request from 'request';
import xml2json = require('xml2json');

module.exports = (req: express.Request, res: express.Response) => {
	const url: string = req.body.url;

	request(url, (err, response, xml) => {
		if (err) {
			res.sendStatus(500);
		} else {
			res.send(xml2json.toJson(xml));
		}
	});
};
