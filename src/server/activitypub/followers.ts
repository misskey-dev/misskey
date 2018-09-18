import * as mongo from 'mongodb';
import * as Router from 'koa-router';
import config from '../../config';
import $ from 'cafy'; import ID from '../../misc/cafy-id';
import User from '../../models/user';
import Following from '../../models/following';
import pack from '../../remote/activitypub/renderer';
import renderOrderedCollection from '../../remote/activitypub/renderer/ordered-collection';
import renderOrderedCollectionPage from '../../remote/activitypub/renderer/ordered-collection-page';
import renderFollowUser from '../../remote/activitypub/renderer/follow-user';
import { setResponseType } from '../activitypub';

export default async (ctx: Router.IRouterContext) => {
	const userId = new mongo.ObjectID(ctx.params.user);

	// Get 'cursor' parameter
	const [cursor = null, cursorErr] = $.type(ID).optional.get(ctx.request.query.cursor);

	// Get 'page' parameter
	const pageErr = !$.str.optional.or(['true', 'false']).ok(ctx.request.query.page);
	const page: boolean = ctx.request.query.page === 'true';

	// Validate parameters
	if (cursorErr || pageErr) {
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

	const limit = 10;
	const partOf = `${config.url}/users/${userId}/followers`;

	if (page) {
		// Construct query
		const query = {
			followeeId: user._id
		} as any;

		// カーソルが指定されている場合
		if (cursor) {
			query._id = {
				$lt: cursor
			};
		}

		// Get followers
		const followings = await Following
			.find(query, {
				limit: limit + 1,
				sort: { _id: -1 }
			});

		// 「次のページ」があるかどうか
		const inStock = followings.length === limit + 1;
		if (inStock) followings.pop();

		const renderedFollowers = await Promise.all(followings.map(following => renderFollowUser(following.followerId)));
		const rendered = renderOrderedCollectionPage(
			`${partOf}?page=true${cursor ? `&cursor=${cursor}` : ''}`,
			user.followersCount, renderedFollowers, partOf,
			null,
			inStock ? `${partOf}?page=true&cursor=${followings[followings.length - 1]._id}` : null
		);

		ctx.body = pack(rendered);
		setResponseType(ctx);
	} else {
		// index page
		const rendered = renderOrderedCollection(partOf, user.followersCount, `${partOf}?page=true`, null);
		ctx.body = pack(rendered);
		ctx.set('Cache-Control', 'private, max-age=0, must-revalidate');
		setResponseType(ctx);
	}
};
