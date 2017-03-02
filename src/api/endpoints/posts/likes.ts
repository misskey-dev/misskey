'use strict';

/**
 * Module dependencies
 */
import it from '../../it';
import Post from '../../models/post';
import Like from '../../models/like';
import serialize from '../../serializers/user';

/**
 * Show a likes of a post
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) =>
	new Promise(async (res, rej) =>
{
	// Get 'post_id' parameter
	const [postId, postIdErr] = it(params.post_id, 'id', true);
	if (postIdErr) return rej('invalid post_id');

	// Get 'limit' parameter
	const [limit, limitErr] = it(params.limit).expect.number().range(1, 100).default(10).qed();
	if (limitErr) return rej('invalid limit');

	// Get 'offset' parameter
	const [offset, offsetErr] = it(params.offset).expect.number().min(0).default(0).qed();
	if (offsetErr) return rej('invalid offset');

	// Get 'sort' parameter
	const [sort] = it(params.sort).expect.string().or('desc asc').default('desc').qed();
	let sort = params.sort || 'desc';

	// Lookup post
	const post = await Post.findOne({
		_id: new mongo.ObjectID(postId)
	});

	if (post === null) {
		return rej('post not found');
	}

	// Issue query
	const likes = await Like
		.find({
			post_id: post._id,
			deleted_at: { $exists: false }
		}, {
			limit: limit,
			skip: offset,
			sort: {
				_id: sort == 'asc' ? 1 : -1
			}
		});

	// Serialize
	res(await Promise.all(likes.map(async like =>
		await serialize(like.user_id, user))));
});
