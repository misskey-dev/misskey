import Router from '@koa/router';
import config from '@/config/index.js';
import { renderActivity } from '@/remote/activitypub/renderer/index.js';
import renderOrderedCollection from '@/remote/activitypub/renderer/ordered-collection.js';
import { setResponseType } from '../activitypub.js';
import renderNote from '@/remote/activitypub/renderer/note.js';
import { Users, Notes, UserNotePinings } from '@/models/index.js';
import { IsNull } from 'typeorm';

export default async (ctx: Router.RouterContext) => {
	const userId = ctx.params.user;

	const user = await Users.findOneBy({
		id: userId,
		host: IsNull(),
	});

	if (user == null) {
		ctx.status = 404;
		return;
	}

	const pinings = await UserNotePinings.find({
		where: { userId: user.id },
		order: { id: 'DESC' },
	});

	const pinnedNotes = await Promise.all(pinings.map(pining =>
		Notes.findOneByOrFail({ id: pining.noteId })));

	const renderedNotes = await Promise.all(pinnedNotes.map(note => renderNote(note)));

	const rendered = renderOrderedCollection(
		`${config.url}/users/${userId}/collections/featured`,
		renderedNotes.length, undefined, undefined, renderedNotes,
	);

	ctx.body = renderActivity(rendered);
	ctx.set('Cache-Control', 'public, max-age=180');
	setResponseType(ctx);
};
