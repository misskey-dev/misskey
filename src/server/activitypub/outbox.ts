import * as express from 'express';
import context from '../../remote/activitypub/renderer/context';
import renderNote from '../../remote/activitypub/renderer/note';
import renderOrderedCollection from '../../remote/activitypub/renderer/ordered-collection';
import config from '../../config';
import Note from '../../models/note';
import User from '../../models/user';

const app = express.Router();

app.get('/users/:user/outbox', async (req, res) => {
	const userId = req.params.user;

	const user = await User.findOne({ _id: userId });

	const notes = await Note.find({ userId: user._id }, {
		limit: 20,
		sort: { _id: -1 }
	});

	const renderedNotes = await Promise.all(notes.map(note => renderNote(note)));
	const rendered = renderOrderedCollection(`${config.url}/users/${userId}/inbox`, user.notesCount, renderedNotes);
	rendered['@context'] = context;

	res.json(rendered);
});

export default app;
