import * as bodyParser from 'body-parser';
import * as express from 'express';
import { parseRequest, verifySignature } from 'http-signature';
import User, { IRemoteUser } from '../../models/user';
import queue from '../../queue';
import parseAcct from '../../acct/parse';

const app = express();
app.disable('x-powered-by');
app.use(bodyParser.json());

app.post('/@:user/inbox', async (req, res) => {
	let parsed;

	req.headers.authorization = 'Signature ' + req.headers.signature;

	try {
		parsed = parseRequest(req);
	} catch (exception) {
		return res.sendStatus(401);
	}

	const keyIdLower = parsed.keyId.toLowerCase();
	let query;

	if (keyIdLower.startsWith('acct:')) {
		const { username, host } = parseAcct(keyIdLower.slice('acct:'.length));
		if (host === null) {
			return res.sendStatus(401);
		}

		query = { usernameLower: username, hostLower: host };
	} else {
		query = {
			host: { $ne: null },
			'account.publicKey.id': parsed.keyId
		};
	}

	const user = await User.findOne(query) as IRemoteUser;

	if (user === null) {
		return res.sendStatus(401);
	}

	if (!verifySignature(parsed, user.account.publicKey.publicKeyPem)) {
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
