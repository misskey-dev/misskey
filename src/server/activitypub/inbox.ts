import * as bodyParser from 'body-parser';
import * as express from 'express';
import { parseRequest, verifySignature } from 'http-signature';
import User, { IRemoteAccount } from '../../models/user';
import queue from '../../queue';

const app = express();
app.disable('x-powered-by');
app.use(bodyParser.json());

app.post('/@:user/inbox', async (req, res) => {
	let parsed;

	try {
		parsed = parseRequest(req);
	} catch (exception) {
		return res.sendStatus(401);
	}

	const user = await User.findOne({
		host: { $ne: null },
		'account.publicKey.id': parsed.keyId
	});

	if (user === null) {
		return res.sendStatus(401);
	}

	if (!verifySignature(parsed, (user.account as IRemoteAccount).publicKey.publicKeyPem)) {
		return res.sendStatus(401);
	}

	queue.create('http', {
		type: 'performActivityPub',
		actor: user._id,
		outbox: req.body,
	}).save();

	return res.status(202).end();
});

export default app;
