'use strict';

/**
 * Module dependencies
 */
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
		let includeReplies = params.include_replies;
		if (includeReplies === true) {
			includeReplies = true;
		} else {
			includeReplies = false;
		}

		// Get 'include_reposts' parameter
		let includeReposts = params.include_reposts;
		if (includeReposts === true) {
			includeReposts = true;
		} else {
			includeReposts = false;
		}

		// Get 'limit' parameter
		let limit = params.limit;
		if (limit !== undefined && limit !== null) {
			limit = parseInt(limit, 10);

			// From 1 to 100
			if (!(1 <= limit && limit <= 100)) {
				return rej('invalid limit range');
			}
		} else {
			limit = 10;
		}

		const since = params.since_id || null;
		const max = params.max_id || null;

		// Check if both of since_id and max_id is specified
		if (since !== null && max !== null) {
			return rej('cannot set since_id and max_id');
		}

		// Construct query
		const sort = {
			_id: -1
		};
		const query = {};
		if (since !== null) {
			sort._id = 1;
			query._id = {
				$gt: new mongo.ObjectID(since)
			};
		} else if (max !== null) {
			query._id = {
				$lt: new mongo.ObjectID(max)
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
