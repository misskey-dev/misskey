import * as express from 'express';
import context from '../../remote/activitypub/renderer/context';
import render from '../../remote/activitypub/renderer/key';
import User, { isLocalUser } from '../../models/user';

const app = express.Router();

app.get('/users/:user/publickey', async (req, res) => {
	const userId = req.params.user;

	const user = await User.findOne({ _id: userId });

	if (isLocalUser(user)) {
		const rendered = render(user);
		rendered['@context'] = context;

		res.json(rendered);
	} else {
		res.sendStatus(400);
	}
});

export default app;
