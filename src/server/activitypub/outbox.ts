import * as mongo from 'mongodb';
import * as Router from 'koa-router';
import config from '../../config';
import $ from 'cafy'; import ID from '../../misc/cafy-id';
import User from '../../models/user';
import pack from '../../remote/activitypub/renderer';
import renderOrderedCollection from '../../remote/activitypub/renderer/ordered-collection';
import renderOrderedCollectionPage from '../../remote/activitypub/renderer/ordered-collection-page';
import { setResponseType } from '../activitypub';

import Note, { INote } from '../../models/note';
import renderNote from '../../remote/activitypub/renderer/note';
import renderCreate from '../../remote/activitypub/renderer/create';
import renderAnnounce from '../../remote/activitypub/renderer/announce';
import { countIf } from '../../prelude/array';

export default async (ctx: Router.IRouterContext) => {
	const userId = new mongo.ObjectID(ctx.params.user);

	// Get 'sinceId' parameter
	const [sinceId, sinceIdErr] = $.type(ID).optional.get(ctx.request.query.since_id);

	// Get 'untilId' parameter
	const [untilId, untilIdErr] = $.type(ID).optional.get(ctx.request.query.until_id);

	// Get 'page' parameter
	const pageErr = !$.str.optional.or(['true', 'false']).ok(ctx.request.query.page);
	const page: boolean = ctx.request.query.page === 'true';

	// Validate parameters
	if (sinceIdErr || untilIdErr || pageErr || countIf(x => x != null, [sinceId, untilId]) > 1) {
		ctx.status = 400;
		return;
	}

	// Verify user
	const user = await User.findOne({
		_id: userId,
		host: null
	});

	if (user === null) {
		ctx.status = 404;
		return;
	}

	const limit = 20;
	const partOf = `${config.url}/users/${userId}/outbox`;

	if (page) {
		//#region Construct query
		const sort = {
			_id: -1
		};

		const query = {
			userId: user._id,
			visibility: { $in: ['public', 'home'] }
		} as any;

		if (sinceId) {
			sort._id = 1;
			query._id = {
				$gt: sinceId
			};
		} else if (untilId) {
			query._id = {
				$lt: untilId
			};
		}
		//#endregion

		// Issue query
		const notes = await Note
			.find(query, {
				limit: limit,
				sort: sort
			});

		if (sinceId) notes.reverse();

		const activities = await Promise.all(notes.map(note => packActivity(note)));
		const rendered = renderOrderedCollectionPage(
			`${partOf}?page=true${sinceId ? `&since_id=${sinceId}` : ''}${untilId ? `&until_id=${untilId}` : ''}`,
			user.notesCount, activities, partOf,
			notes.length > 0 ? `${partOf}?page=true&since_id=${notes[0]._id}` : null,
			notes.length > 0 ? `${partOf}?page=true&until_id=${notes[notes.length - 1]._id}` : null
		);

		ctx.body = pack(rendered);
		ctx.set('Cache-Control', 'private, max-age=0, must-revalidate');
		setResponseType(ctx);
	} else {
		// index page
		const rendered = renderOrderedCollection(partOf, user.notesCount,
			`${partOf}?page=true`,
			`${partOf}?page=true&since_id=000000000000000000000000`
		);
		ctx.body = pack(rendered);
		ctx.set('Cache-Control', 'private, max-age=0, must-revalidate');
		setResponseType(ctx);
	}
};

/**
 * Pack Create<Note> or Announce Activity
 * @param note Note
 */
export async function packActivity(note: INote): Promise<object> {
	if (note.renoteId && note.text == null && note.poll == null && (note.fileIds == null || note.fileIds.length == 0)) {
		const renote = await Note.findOne(note.renoteId);
		return renderAnnounce(renote.uri ? renote.uri : `${config.url}/notes/${renote._id}`, note);
	}

	return renderCreate(await renderNote(note, false), note);
}
