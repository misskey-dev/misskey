import * as express from 'express';
import context from '../../remote/activitypub/renderer/context';
import render from '../../remote/activitypub/renderer/note';
import parseAcct from '../../misc/user/parse-acct';
import Post from '../../models/post';
import User from '../../models/user';

const app = express();
app.disable('x-powered-by');

app.get('/@:user/:post', async (req, res, next) => {
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

	const post = await Post.findOne({
		_id: req.params.post,
		userId: user._id
	});
	if (post === null) {
		return res.sendStatus(404);
	}

	const rendered = await render(user, post);
	rendered['@context'] = context;

	res.json(rendered);
});

export default app;
