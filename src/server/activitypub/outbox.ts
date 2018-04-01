import * as express from 'express';
import context from '../../common/remote/activitypub/renderer/context';
import renderNote from '../../common/remote/activitypub/renderer/note';
import renderOrderedCollection from '../../common/remote/activitypub/renderer/ordered-collection';
import parseAcct from '../../common/user/parse-acct';
import config from '../../conf';
import Post from '../../models/post';
import User from '../../models/user';

const app = express();
app.disable('x-powered-by');

app.get('/@:user/outbox', async (req, res) => {
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

	const id = `${config.url}/@${user.username}/inbox`;

	if (username !== user.username) {
		return res.redirect(id);
	}

	const posts = await Post.find({ userId: user._id }, {
		limit: 20,
		sort: { _id: -1 }
	});

	const renderedPosts = await Promise.all(posts.map(post => renderNote(user, post)));
	const rendered = renderOrderedCollection(id, user.postsCount, renderedPosts);
	rendered['@context'] = context;

	res.json(rendered);
});

export default app;
