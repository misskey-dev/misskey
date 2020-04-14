
import * as Router from '@koa/router';
import config from '../../config';
import $ from 'cafy';
import { renderLike } from '../../remote/activitypub/renderer/like';
import { renderActivity } from '../../remote/activitypub/renderer';
import renderOrderedCollection from '../../remote/activitypub/renderer/ordered-collection';
import renderOrderedCollectionPage from '../../remote/activitypub/renderer/ordered-collection-page';
import { setResponseType } from '../activitypub';
import * as url from '../../prelude/url';
import { Notes, NoteReactions } from '../../models';
import { In } from 'typeorm';

export default async (ctx: Router.RouterContext) => {
	const offsetErr = !$.optional.str.match(/^\d+$/).ok(ctx.request.query.offset);
	const offset: number = JSON.parse(ctx.request.query.offset || 0);

	const pageErr = !$.optional.str.or(['true', 'false']).ok(ctx.request.query.page);
	const page: boolean = ctx.request.query.page === 'true';

	if (offsetErr || pageErr) {
		ctx.status = 400;
		return;
	}

	const note = await Notes.findOne({
		id: ctx.params.note,
		visibility: In(['public', 'home']),
		localOnly: false
	});

	if (note == null) {
		ctx.status = 404;
		return;
	}

	const limit = 20;
	const partOf = `${config.url}/notes/${note.id}/likes`;
	const totalItems = note.reactions ? Object.values(note.reactions).reduce((a, c) => a + c, 0) : 0;

	if (page) {
		const reactions = await NoteReactions.find({
			where: {
				noteId: note.id
			},
			take: limit,
			skip: offset,
			order: {
				id: -1
			}
		});

		const activities = await Promise.all(reactions.map(reaction => renderLike(reaction, note)));
		const rendered = renderOrderedCollectionPage(
			// id
			`${partOf}?${url.query({
				page: 'true',
				offset
			})}`,
			// totalItems
			totalItems,
			// items
			activities,
			// partOf
			partOf,
			// prev page
			undefined,
			// next page
			reactions.length ? `${partOf}?${url.query({
				page: 'true',
				offset: `${offset + limit}`
			})}` : undefined
		);

		ctx.body = renderActivity(rendered);
		ctx.set('Cache-Control', 'private, max-age=0, must-revalidate');
		setResponseType(ctx);
	} else {
		// index page

		const rendered = renderOrderedCollection(
			partOf,	// id
			totalItems,	// totalItems
			`${partOf}?page=true`	// first page
		);

		ctx.body = renderActivity(rendered);
		ctx.set('Cache-Control', 'private, max-age=0, must-revalidate');
		setResponseType(ctx);
	}
};
