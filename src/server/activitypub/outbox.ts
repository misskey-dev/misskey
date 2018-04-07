import * as express from 'express';
import context from '../../remote/activitypub/renderer/context';
import renderNote from '../../remote/activitypub/renderer/note';
import renderOrderedCollection from '../../remote/activitypub/renderer/ordered-collection';
import config from '../../config';
import Note from '../../models/note';
import withUser from './with-user';

const app = express.Router();

app.get('/@:user/outbox', withUser(username => {
	return `${config.url}/@${username}/inbox`;
}, async (user, req, res) => {
	const notes = await Note.find({ userId: user._id }, {
		limit: 20,
		sort: { _id: -1 }
	});

	const renderedNotes = await Promise.all(notes.map(note => renderNote(user, note)));
	const rendered = renderOrderedCollection(`${config.url}/@${user.username}/inbox`, user.notesCount, renderedNotes);
	rendered['@context'] = context;

	res.json(rendered);
}));

export default app;
