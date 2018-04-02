import * as express from 'express';
import context from '../../remote/activitypub/renderer/context';
import renderNote from '../../remote/activitypub/renderer/note';
import renderOrderedCollection from '../../remote/activitypub/renderer/ordered-collection';
import config from '../../config';
import Post from '../../models/post';
import withUser from './with-user';

const app = express();
app.disable('x-powered-by');

app.get('/@:user/outbox', withUser(username => {
	return `${config.url}/@${username}/inbox`;
}, async (user, req, res) => {
	const posts = await Post.find({ userId: user._id }, {
		limit: 20,
		sort: { _id: -1 }
	});

	const renderedPosts = await Promise.all(posts.map(post => renderNote(user, post)));
	const rendered = renderOrderedCollection(`${config.url}/@${user.username}/inbox`, user.postsCount, renderedPosts);
	rendered['@context'] = context;

	res.json(rendered);
}));

export default app;
