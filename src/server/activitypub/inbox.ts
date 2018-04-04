import * as bodyParser from 'body-parser';
import * as express from 'express';
import { parseRequest } from 'http-signature';
import { createHttp } from '../../queue';

const app = express();

app.disable('x-powered-by');

app.post('/@:user/inbox', bodyParser.json({
	type() {
		return true;
	}
}), async (req, res) => {
	let signature;

	req.headers.authorization = 'Signature ' + req.headers.signature;

	try {
		signature = parseRequest(req);
	} catch (exception) {
		return res.sendStatus(401);
	}

	createHttp({
		type: 'processInbox',
		activity: req.body,
		signature,
	}).save();

	return res.status(202).end();
});

export default app;
