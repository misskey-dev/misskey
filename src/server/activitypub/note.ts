import * as express from 'express';
import context from '../../remote/activitypub/renderer/context';
import render from '../../remote/activitypub/renderer/note';
import parseAcct from '../../acct/parse';
import Note from '../../models/note';
import User from '../../models/user';

const app = express.Router();

app.get('/@:user/:note', async (req, res, next) => {
	const accepted = req.accepts(['html', 'application/activity+json', 'application/ld+json']);
	if (!(['application/activity+json', 'application/ld+json'] as any[]).includes(accepted)) {
		return next();
	}

	const { username, host } = parseAcct(req.params.user);
	if (host !== null) {
		return res.sendStatus(422);
	}

	const user = await User.findOne({
		usernameLower: username.toLowerCase(),
		host: null
	});
	if (user === null) {
		return res.sendStatus(404);
	}

	const note = await Note.findOne({
		_id: req.params.note,
		userId: user._id
	});
	if (note === null) {
		return res.sendStatus(404);
	}

	const rendered = await render(user, note);
	rendered['@context'] = context;

	res.json(rendered);
});

export default app;
