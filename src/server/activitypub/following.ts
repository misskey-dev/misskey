import * as Router from '@koa/router';
import config from '../../config';
import $ from 'cafy';
import { ID } from '../../misc/cafy-id';
import * as url from '../../prelude/url';
import { renderActivity } from '../../remote/activitypub/renderer';
import renderOrderedCollection from '../../remote/activitypub/renderer/ordered-collection';
import renderOrderedCollectionPage from '../../remote/activitypub/renderer/ordered-collection-page';
import renderFollowUser from '../../remote/activitypub/renderer/follow-user';
import { setResponseType } from '../activitypub';
import { Users, Followings } from '../../models';
import { LessThan, FindConditions } from 'typeorm';
import { Following } from '../../models/entities/following';

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
		host: null
	});

	if (user == null) {
		ctx.status = 404;
		return;
	}

	const limit = 10;
	const partOf = `${config.url}/users/${userId}/following`;

	if (page) {
		const query = {
			followerId: user.id
		} as FindConditions<Following>;

		// カーソルが指定されている場合
		if (cursor) {
			query.id = LessThan(cursor);
		}

		// Get followings
		const followings = await Followings.find({
			where: query,
			take: limit + 1,
			order: { id: -1 }
		});

		// 「次のページ」があるかどうか
		const inStock = followings.length === limit + 1;
		if (inStock) followings.pop();

		const renderedFollowees = await Promise.all(followings.map(following => renderFollowUser(following.followeeId)));
		const rendered = renderOrderedCollectionPage(
			`${partOf}?${url.query({
				page: 'true',
				cursor
			})}`,
			user.followingCount, renderedFollowees, partOf,
			undefined,
			inStock ? `${partOf}?${url.query({
				page: 'true',
				cursor: followings[followings.length - 1].id
			})}` : undefined
		);

		ctx.body = renderActivity(rendered);
		setResponseType(ctx);
	} else {
		// index page
		const rendered = renderOrderedCollection(partOf, user.followingCount, `${partOf}?page=true`);
		ctx.body = renderActivity(rendered);
		ctx.set('Cache-Control', 'private, max-age=0, must-revalidate');
		setResponseType(ctx);
	}
};
