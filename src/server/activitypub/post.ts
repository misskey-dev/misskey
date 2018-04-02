import * as express from 'express';
import context from '../../remote/activitypub/renderer/context';
import render from '../../remote/activitypub/renderer/note';
import Post from '../../models/post';
import User from '../../models/user';

const app = express();
app.disable('x-powered-by');

app.get('/posts/:post', async (req, res, next) => {
	const accepted = req.accepts(['html', 'application/activity+json', 'application/ld+json']);
	if (!(['application/activity+json', 'application/ld+json'] as any[]).includes(accepted)) {
		return next();
	}

	const post = await Post.findOne({
		_id: req.params.post
	});
	if (post === null) {
		return res.sendStatus(404);
	}

	const user = await User.findOne({
		_id: post.userId
	});
	if (user === null) {
		return res.sendStatus(404);
	}

	const rendered = await render(user, post);
	rendered['@context'] = context;

	res.json(rendered);
});

export default app;
