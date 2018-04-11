import * as express from 'express';
import context from '../../remote/activitypub/renderer/context';
import render from '../../remote/activitypub/renderer/note';
import Note from '../../models/note';

const app = express.Router();

app.get('/notes/:note', async (req, res, next) => {
	const accepted = req.accepts(['html', 'application/activity+json', 'application/ld+json']);
	if (!(['application/activity+json', 'application/ld+json'] as any[]).includes(accepted)) {
		return next();
	}

	const note = await Note.findOne({
		_id: req.params.note
	});

	if (note === null) {
		return res.sendStatus(404);
	}

	const rendered = await render(note);
	rendered['@context'] = context;

	res.json(rendered);
});

export default app;
