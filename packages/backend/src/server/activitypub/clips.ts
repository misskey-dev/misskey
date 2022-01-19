import * as Router from '@koa/router';
import config from '@/config/index';
import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import * as url from '@/prelude/url';
import { renderActivity } from '@/remote/activitypub/renderer';
import renderOrderedCollection from '@/remote/activitypub/renderer/ordered-collection';
import renderOrderedCollectionPage from '@/remote/activitypub/renderer/ordered-collection-page';
import { setResponseType } from '../activitypub';
import { Users, Clips, UserProfiles } from '@/models/index';
import { LessThan, FindConditions } from 'typeorm';
import { Clip } from '@/models/entities/clip';

export default async (ctx: Router.RouterContext) => {
	const userId = ctx.params.user;

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
	const user = await Users.findOne({
		id: userId,
		host: null,
	});

	if (user == null) {
		ctx.status = 404;
		return;
	}

	//#region Check ff visibility
	const profile = await UserProfiles.findOneOrFail(user.id);

	if (profile.ffVisibility === 'private') {
		ctx.status = 403;
		ctx.set('Cache-Control', 'public, max-age=30');
		return;
	} else if (profile.ffVisibility === 'followers') {
		ctx.status = 403;
		ctx.set('Cache-Control', 'public, max-age=30');
		return;
	}
	//#endregion

	const limit = 10;
	const partOf = `${config.url}/users/${userId}/clips`;

	const query = {
		userId,
		isPublic: true,
	} as FindConditions<Clip>;

	// TODO: optimize (store in user maybe?)
	const nClips = await Clips.count({
		where: query,
	});

	if (page) {
		// カーソルが指定されている場合
		if (cursor) {
			query.id = LessThan(cursor);
		}

		// Get clips
		const clips = await Clips.find({
			where: query,
			take: limit + 1,
			order: { id: -1 },
		});


		// 「次のページ」があるかどうか
		const inStock = clips.length === limit + 1;
		if (inStock) clips.pop();

		const renderedClips = clips.map(clip => `${config.url}/clips/${clip.id}`);
		const rendered = renderOrderedCollectionPage(
			`${partOf}?${url.query({
				page: 'true',
				cursor,
			})}`,
			nClips, renderedClips, partOf,
			undefined,
			inStock ? `${partOf}?${url.query({
				page: 'true',
				cursor: clips[clips.length - 1].id,
			})}` : undefined
		);

		ctx.body = renderActivity(rendered);
		setResponseType(ctx);
	} else {
		// index page
		const rendered = renderOrderedCollection(partOf, nClips, `${partOf}?page=true`);
		ctx.body = renderActivity(rendered);
		ctx.set('Cache-Control', 'public, max-age=180');
		setResponseType(ctx);
	}
};
