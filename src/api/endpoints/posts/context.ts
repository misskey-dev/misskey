'use strict';

/**
 * Module dependencies
 */
import it from '../../it';
import Post from '../../models/post';
import serialize from '../../serializers/post';

/**
 * Show a context of a post
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
	const [offset, offsetErr] = it(params.limit).expect.number().min(0).default(0).qed();
	if (offsetErr) return rej('invalid offset');

	// Lookup post
	const post = await Post.findOne({
		_id: postId
	});

	if (post === null) {
		return rej('post not found');
	}

	const context = [];
	let i = 0;

	async function get(id) {
		i++;
		const p = await Post.findOne({ _id: id });

		if (i > offset) {
			context.push(p);
		}

		if (context.length == limit) {
			return;
		}

		if (p.reply_to_id) {
			await get(p.reply_to_id);
		}
	}

	if (post.reply_to_id) {
		await get(post.reply_to_id);
	}

	// Serialize
	res(await Promise.all(context.map(async post =>
		await serialize(post, user))));
});
