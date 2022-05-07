import Router from '@koa/router';
import { FindOptionsWhere, IsNull, LessThan } from 'typeorm';
import config from '@/config/index.js';
import * as url from '@/prelude/url.js';
import { renderActivity } from '@/remote/activitypub/renderer/index.js';
import renderOrderedCollection from '@/remote/activitypub/renderer/ordered-collection.js';
import renderOrderedCollectionPage from '@/remote/activitypub/renderer/ordered-collection-page.js';
import renderFollowUser from '@/remote/activitypub/renderer/follow-user.js';
import { Users, Followings, UserProfiles } from '@/models/index.js';
import { Following } from '@/models/entities/following.js';
import { setResponseType } from '../activitypub.js';

export default async (ctx: Router.RouterContext) => {
	const userId = ctx.params.user;

	const cursor = ctx.request.query.cursor;
	if (cursor != null && typeof cursor !== 'string') {
		ctx.status = 400;
		return;
	}

	const page = ctx.request.query.page === 'true';

	const user = await Users.findOneBy({
		id: userId,
		host: IsNull(),
	});

	if (user == null) {
		ctx.status = 404;
		return;
	}

	//#region Check ff visibility
	const profile = await UserProfiles.findOneByOrFail({ userId: user.id });

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
	const partOf = `${config.url}/users/${userId}/followers`;

	if (page) {
		const query = {
			followeeId: user.id,
		} as FindOptionsWhere<Following>;

		// カーソルが指定されている場合
		if (cursor) {
			query.id = LessThan(cursor);
		}

		// Get followers
		const followings = await Followings.find({
			where: query,
			take: limit + 1,
			order: { id: -1 },
		});

		// 「次のページ」があるかどうか
		const inStock = followings.length === limit + 1;
		if (inStock) followings.pop();

		const renderedFollowers = await Promise.all(followings.map(following => renderFollowUser(following.followerId)));
		const rendered = renderOrderedCollectionPage(
			`${partOf}?${url.query({
				page: 'true',
				cursor,
			})}`,
			user.followersCount, renderedFollowers, partOf,
			undefined,
			inStock ? `${partOf}?${url.query({
				page: 'true',
				cursor: followings[followings.length - 1].id,
			})}` : undefined,
		);

		ctx.body = renderActivity(rendered);
		setResponseType(ctx);
	} else {
		// index page
		const rendered = renderOrderedCollection(partOf, user.followersCount, `${partOf}?page=true`);
		ctx.body = renderActivity(rendered);
		ctx.set('Cache-Control', 'public, max-age=180');
		setResponseType(ctx);
	}
};
