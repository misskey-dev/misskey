/**
 * Module dependencies
 */
import it from '../../it';
import Post from '../../models/post';
import serialize from '../../serializers/post';

/**
 * Show a replies of a post
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'post_id' parameter
	const [postId, postIdErr] = it(params.post_id, 'id', true);
	if (postIdErr) return rej('invalid post_id param');

	// Get 'limit' parameter
	const [limit, limitErr] = it(params.limit).expect.number().range(1, 100).default(10).qed();
	if (limitErr) return rej('invalid limit param');

	// Get 'offset' parameter
	const [offset, offsetErr] = it(params.offset).expect.number().min(0).default(0).qed();
	if (offsetErr) return rej('invalid offset param');

	// Get 'sort' parameter
	const [sort, sortError] = it(params.sort).expect.string().or('desc asc').default('desc').qed();
	if (sortError) return rej('invalid sort param');

	// Lookup post
	const post = await Post.findOne({
		_id: postId
	});

	if (post === null) {
		return rej('post not found');
	}

	// Issue query
	const replies = await Post
		.find({ reply_to_id: post._id }, {
			limit: limit,
			skip: offset,
			sort: {
				_id: sort == 'asc' ? 1 : -1
			}
		});

	// Serialize
	res(await Promise.all(replies.map(async post =>
		await serialize(post, user))));
});
