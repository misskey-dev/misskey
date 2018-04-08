import * as express from 'express';
import context from '../../remote/activitypub/renderer/context';
import render from '../../remote/activitypub/renderer/person';
import User from '../../models/user';

const app = express.Router();

app.get('/users/:user', async (req, res) => {
	const userId = req.params.user;

	const user = await User.findOne({ _id: userId });

	const rendered = render(user);
	rendered['@context'] = context;

	res.json(rendered);
});

export default app;
