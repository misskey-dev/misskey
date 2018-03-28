/**
 * Module dependencies
 */
import $ from 'cafy';
import Post, { pack } from '../../models/post';

/**
 * Show a context of a post
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'post_id' parameter
	const [postId, postIdErr] = $(params.post_id).id().$;
	if (postIdErr) return rej('invalid post_id param');

	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 100).$;
	if (limitErr) return rej('invalid limit param');

	// Get 'offset' parameter
	const [offset = 0, offsetErr] = $(params.offset).optional.number().min(0).$;
	if (offsetErr) return rej('invalid offset param');

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

		if (p.reply_id) {
			await get(p.reply_id);
		}
	}

	if (post.reply_id) {
		await get(post.reply_id);
	}

	// Serialize
	res(await Promise.all(context.map(async post =>
		await pack(post, user))));
});
