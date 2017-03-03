'use strict';

/**
 * Module dependencies
 */
import it from '../it';
import Post from '../models/post';
import serialize from '../serializers/post';

/**
 * Lists all posts
 *
 * @param {any} params
 * @return {Promise<any>}
 */
module.exports = (params) =>
	new Promise(async (res, rej) => {
		// Get 'include_replies' parameter
		const [includeReplies, includeRepliesErr] = it(params.include_replies).expect.boolean().default(true).qed();
		if (includeRepliesErr) return rej('invalid include_replies param');

		// Get 'include_reposts' parameter
		const [includeReposts, includeRepostsErr] = it(params.include_reposts).expect.boolean().default(true).qed();
		if (includeRepostsErr) return rej('invalid include_reposts param');

		// Get 'limit' parameter
		const [limit, limitErr] = it(params.limit).expect.number().range(1, 100).default(10).qed();
		if (limitErr) return rej('invalid limit param');

		// Get 'since_id' parameter
		const [sinceId, sinceIdErr] = it(params.since_id).expect.id().qed();
		if (sinceIdErr) return rej('invalid since_id param');

		// Get 'max_id' parameter
		const [maxId, maxIdErr] = it(params.max_id).expect.id().qed();
		if (maxIdErr) return rej('invalid max_id param');

		// Check if both of since_id and max_id is specified
		if (sinceId && maxId) {
			return rej('cannot set since_id and max_id');
		}

		// Construct query
		const sort = {
			_id: -1
		};
		const query = {} as any;
		if (sinceId) {
			sort._id = 1;
			query._id = {
				$gt: sinceId
			};
		} else if (maxId) {
			query._id = {
				$lt: maxId
			};
		}

		if (!includeReplies) {
			query.reply_to_id = null;
		}

		if (!includeReposts) {
			query.repost_id = null;
		}

		// Issue query
		const posts = await Post
			.find(query, {
				limit: limit,
				sort: sort
			});

		// Serialize
		res(await Promise.all(posts.map(async post => await serialize(post))));
	});
