import * as Router from '@koa/router';
import config from '../../config';
import $ from 'cafy';
import { ID } from '../../misc/cafy-id';
import { renderActivity } from '../../remote/activitypub/renderer';
import renderOrderedCollection from '../../remote/activitypub/renderer/ordered-collection';
import renderOrderedCollectionPage from '../../remote/activitypub/renderer/ordered-collection-page';
import { setResponseType } from '../activitypub';
import renderNote from '../../remote/activitypub/renderer/note';
import renderCreate from '../../remote/activitypub/renderer/create';
import renderAnnounce from '../../remote/activitypub/renderer/announce';
import { countIf } from '../../prelude/array';
import * as url from '../../prelude/url';
import { Users, Notes } from '../../models';
import { makePaginationQuery } from '../api/common/make-pagination-query';
import { Brackets } from 'typeorm';
import { Note } from '../../models/entities/note';
import { ensure } from '../../prelude/ensure';

export default async (ctx: Router.RouterContext) => {
	const userId = ctx.params.user;

	// Get 'sinceId' parameter
	const [sinceId, sinceIdErr] = $.optional.type(ID).get(ctx.request.query.since_id);

	// Get 'untilId' parameter
	const [untilId, untilIdErr] = $.optional.type(ID).get(ctx.request.query.until_id);

	// Get 'page' parameter
	const pageErr = !$.optional.str.or(['true', 'false']).ok(ctx.request.query.page);
	const page: boolean = ctx.request.query.page === 'true';

	// Validate parameters
	if (sinceIdErr || untilIdErr || pageErr || countIf(x => x != null, [sinceId, untilId]) > 1) {
		ctx.status = 400;
		return;
	}

	// Verify user
	const user = await Users.findOne({
		id: userId,
		host: null
	});

	if (user == null) {
		ctx.status = 404;
		return;
	}

	const limit = 20;
	const partOf = `${config.url}/users/${userId}/outbox`;

	if (page) {
		const query = makePaginationQuery(Notes.createQueryBuilder('note'), sinceId, untilId)
			.andWhere('note.userId = :userId', { userId: user.id })
			.andWhere(new Brackets(qb => { qb
				.where(`note.visibility = 'public'`)
				.orWhere(`note.visibility = 'home'`);
			}))
			.andWhere('note.localOnly = FALSE');

		const notes = await query.take(limit).getMany();

		if (sinceId) notes.reverse();

		const activities = await Promise.all(notes.map(note => packActivity(note)));
		const rendered = renderOrderedCollectionPage(
			`${partOf}?${url.query({
				page: 'true',
				since_id: sinceId,
				until_id: untilId
			})}`,
			user.notesCount, activities, partOf,
			notes.length ? `${partOf}?${url.query({
				page: 'true',
				since_id: notes[0].id
			})}` : undefined,
			notes.length ? `${partOf}?${url.query({
				page: 'true',
				until_id: notes[notes.length - 1].id
			})}` : undefined
		);

		ctx.body = renderActivity(rendered);
		ctx.set('Cache-Control', 'private, max-age=0, must-revalidate');
		setResponseType(ctx);
	} else {
		// index page
		const rendered = renderOrderedCollection(partOf, user.notesCount,
			`${partOf}?page=true`,
			`${partOf}?page=true&since_id=000000000000000000000000`
		);
		ctx.body = renderActivity(rendered);
		ctx.set('Cache-Control', 'private, max-age=0, must-revalidate');
		setResponseType(ctx);
	}
};

/**
 * Pack Create<Note> or Announce Activity
 * @param note Note
 */
export async function packActivity(note: Note): Promise<any> {
	if (note.renoteId && note.text == null && !note.hasPoll && (note.fileIds == null || note.fileIds.length === 0)) {
		const renote = await Notes.findOne(note.renoteId).then(ensure);
		return renderAnnounce(renote.uri ? renote.uri : `${config.url}/notes/${renote.id}`, note);
	}

	return renderCreate(await renderNote(note, false), note);
}
