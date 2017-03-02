'use strict';

/**
 * Module dependencies
 */
import validate from '../../validator';
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
	const [postId, postIdErr] = validate(params.post_id, 'id', true);
	if (postIdErr) return rej('invalid post_id');

	// Get 'limit' parameter
	let [limit, limitErr] = validate(params.limit, 'number');
	if (limitErr) return rej('invalid limit');

	if (limit !== null) {
		// From 1 to 100
		if (!(1 <= limit && limit <= 100)) {
			return rej('invalid limit range');
		}
	} else {
		limit = 10;
	}

	// Get 'offset' parameter
	let offset = params.offset;
	if (offset !== undefined && offset !== null) {
		offset = parseInt(offset, 10);
	} else {
		offset = 0;
	}

	// Lookup post
	const post = await Post.findOne({
		_id: new mongo.ObjectID(postId)
	});

	if (post === null) {
		return rej('post not found', 'POST_NOT_FOUND');
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
