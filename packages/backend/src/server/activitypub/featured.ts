import Router from '@koa/router';
import config from '@/config/index.js';
import { renderActivity } from '@/remote/activitypub/renderer/index.js';
import renderOrderedCollection from '@/remote/activitypub/renderer/ordered-collection.js';
import { setResponseType } from '../activitypub.js';
import renderNote from '@/remote/activitypub/renderer/note.js';
import { Users, Notes, UserNotePinings } from '@/models/index.js';
import { IsNull } from 'typeorm';
import checkFetch from '@/remote/activitypub/check-fetch.js';
import { fetchMeta } from '@/misc/fetch-meta.js';

export default async (ctx: Router.RouterContext) => {
	const verify = await checkFetch(ctx.req);
	if (verify != 200) {
		ctx.status = verify;
		return;
	}

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

	const meta = await fetchMeta();
	if (meta.secureMode || meta.privateMode) {
		ctx.set('Cache-Control', 'private, max-age=0, must-revalidate');
	} else {
		ctx.set('Cache-Control', 'public, max-age=180');
	}
	setResponseType(ctx);
};
