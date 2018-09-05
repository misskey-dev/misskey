import * as mongo from 'mongodb';
import * as Router from 'koa-router';
import config from '../../config';
import $ from 'cafy'; import ID from '../../misc/cafy-id';
import User from '../../models/user';
import pack from '../../remote/activitypub/renderer';
import renderOrderedCollection from '../../remote/activitypub/renderer/ordered-collection';
import renderOrderedCollectionPage from '../../remote/activitypub/renderer/ordered-collection-page';
import { setResponseType } from '../activitypub';

import Note from '../../models/note';
import renderNote from '../../remote/activitypub/renderer/note';

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
	if (sinceIdErr || untilIdErr || pageErr || [sinceId, untilId].filter(x => x != null).length > 1) {
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
			$and: [{
				$or: [ { visibility: 'public' }, { visibility: 'home' } ]
			}, { // exclude renote, but include quote
				$or: [{
					text: { $ne: null }
				}, {
					fileIds: { $ne: [] }
				}]
			}]
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

		const renderedNotes = await Promise.all(notes.map(note => renderNote(note, false)));
		const rendered = renderOrderedCollectionPage(
			`${partOf}?page=true${sinceId ? `&since_id=${sinceId}` : ''}${untilId ? `&until_id=${untilId}` : ''}`,
			user.notesCount, renderedNotes, partOf,
			notes.length > 0 ? `${partOf}?page=true&since_id=${notes[0]._id}` : null,
			notes.length > 0 ? `${partOf}?page=true&until_id=${notes[notes.length - 1]._id}` : null
		);

		ctx.body = pack(rendered);
		setResponseType(ctx);
	} else {
		// index page
		const rendered = renderOrderedCollection(partOf, user.notesCount,
			`${partOf}?page=true`,
			`${partOf}?page=true&since_id=000000000000000000000000`
		);
		ctx.body = pack(rendered);
		setResponseType(ctx);
	}
};
