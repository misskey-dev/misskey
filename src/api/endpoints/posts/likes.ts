/**
 * Module dependencies
 */
import it from 'cafy';
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
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'post_id' parameter
	const [postId, postIdErr] = it(params.post_id, 'id!').get();
	if (postIdErr) return rej('invalid post_id param');

	// Get 'limit' parameter
	const [limit = 10, limitErr] = it(params.limit).expect.number().range(1, 100).get();
	if (limitErr) return rej('invalid limit param');

	// Get 'offset' parameter
	const [offset = 0, offsetErr] = it(params.offset).expect.number().min(0).get();
	if (offsetErr) return rej('invalid offset param');

	// Get 'sort' parameter
	const [sort = 'desc', sortError] = it(params.sort).expect.string().or('desc asc').get();
	if (sortError) return rej('invalid sort param');

	// Lookup post
	const post = await Post.findOne({
		_id: postId
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
