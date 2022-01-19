import * as Router from '@koa/router';
import config from '@/config/index';
import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import * as url from '@/prelude/url';
import { renderActivity } from '@/remote/activitypub/renderer';
import renderOrderedCollection from '@/remote/activitypub/renderer/ordered-collection';
import renderOrderedCollectionPage from '@/remote/activitypub/renderer/ordered-collection-page';
import { setResponseType } from '../activitypub';
import { Clips, ClipNotes } from '@/models/index';
import { LessThan, FindConditions } from 'typeorm';
import { ClipNote } from '@/models/entities/clip-note';

export default async (ctx: Router.RouterContext) => {
	const clipId = ctx.params.clip;

	// Get 'cursor' parameter
	const [cursor, cursorErr] = $.optional.type(ID).get(ctx.request.query.cursor);

	// Get 'page' parameter
	const pageErr = !$.optional.str.or(['true', 'false']).ok(ctx.request.query.page);
	const page: boolean = ctx.request.query.page === 'true';

	// Validate parameters
	if (cursorErr || pageErr) {
		ctx.status = 400;
		return;
	}

	// Verify user
	const clip = await Clips.findOne({
		id: clipId,
	});

	if (clip == null) {
		ctx.status = 404;
		return;
	}

	//#region Check ff visibility

	if (!clip.isPublic) {
		ctx.status = 403;
		ctx.set('Cache-Control', 'public, max-age=30');
		return;
	}
	//#endregion

	const limit = 10;
	const partOf = `${config.url}/clips/${clipId}`;

	const query = {
		clipId: clip.id,
	} as FindConditions<ClipNote>;

	// TODO: optimize (store in clip maybe?)
	const noteCount = await ClipNotes.count({
		where: query,
	});


	if (page) {
		// カーソルが指定されている場合
		if (cursor) {
			query.id = LessThan(cursor);
		}

		// Get Notes
		const notes = await ClipNotes.find({
			where: query,
			take: limit + 1,
			order: { id: -1 },
		});

		// 「次のページ」があるかどうか
		const inStock = notes.length === limit + 1;
		if (inStock) notes.pop();

		const renderedNotes = notes.map(clipNote => clipNote.note?.uri || `${config.url}/notes/${clipNote.noteId}`);
		const rendered = renderOrderedCollectionPage(
			`${partOf}?${url.query({
				page: 'true',
				cursor,
			})}`,
			noteCount, renderedNotes, partOf,
			undefined,
			inStock ? `${partOf}?${url.query({
				page: 'true',
				cursor: notes[notes.length - 1].id,
			})}` : undefined
		);

		ctx.body = renderActivity(rendered);
		setResponseType(ctx);
	} else {
		// index page
		const rendered = renderOrderedCollection(partOf, noteCount, `${partOf}?page=true`);
		rendered.attributedTo = `${config.url}/users/${clip.userId}`;
		rendered.summary = `misskey:clip`;
		rendered.name = clip.name;
		rendered.content = clip.description;
		ctx.body = renderActivity(rendered);
		ctx.set('Cache-Control', 'public, max-age=180');
		setResponseType(ctx);
	}
};
