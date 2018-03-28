/**
 * Module dependencies
 */
const ms = require('ms');
import $ from 'cafy';
import Post, { pack } from '../../models/post';

/**
 * Get trend posts
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 100).$;
	if (limitErr) return rej('invalid limit param');

	// Get 'offset' parameter
	const [offset = 0, offsetErr] = $(params.offset).optional.number().min(0).$;
	if (offsetErr) return rej('invalid offset param');

	// Get 'reply' parameter
	const [reply, replyErr] = $(params.reply).optional.boolean().$;
	if (replyErr) return rej('invalid reply param');

	// Get 'repost' parameter
	const [repost, repostErr] = $(params.repost).optional.boolean().$;
	if (repostErr) return rej('invalid repost param');

	// Get 'media' parameter
	const [media, mediaErr] = $(params.media).optional.boolean().$;
	if (mediaErr) return rej('invalid media param');

	// Get 'poll' parameter
	const [poll, pollErr] = $(params.poll).optional.boolean().$;
	if (pollErr) return rej('invalid poll param');

	const query = {
		created_at: {
			$gte: new Date(Date.now() - ms('1days'))
		},
		repost_count: {
			$gt: 0
		}
	} as any;

	if (reply != undefined) {
		query.reply_id = reply ? { $exists: true, $ne: null } : null;
	}

	if (repost != undefined) {
		query.repost_id = repost ? { $exists: true, $ne: null } : null;
	}

	if (media != undefined) {
		query.media_ids = media ? { $exists: true, $ne: null } : null;
	}

	if (poll != undefined) {
		query.poll = poll ? { $exists: true, $ne: null } : null;
	}

	// Issue query
	const posts = await Post
		.find(query, {
			limit: limit,
			skip: offset,
			sort: {
				repost_count: -1,
				_id: -1
			}
		});

	// Serialize
	res(await Promise.all(posts.map(async post =>
		await pack(post, user, { detail: true }))));
});
