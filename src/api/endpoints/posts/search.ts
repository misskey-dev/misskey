/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import $ from 'cafy';
const escapeRegexp = require('escape-regexp');
import Post from '../../models/post';
import User from '../../models/user';
import getFriends from '../../common/get-friends';
import serialize from '../../serializers/post';
import config from '../../../conf';

/**
 * Search a post
 *
 * @param {any} params
 * @param {any} me
 * @return {Promise<any>}
 */
module.exports = (params, me) => new Promise(async (res, rej) => {
	// Get 'text' parameter
	const [text, textError] = $(params.text).optional.string().$;
	if (textError) return rej('invalid text param');

	// Get 'user_id' parameter
	const [userId, userIdErr] = $(params.user_id).optional.id().$;
	if (userIdErr) return rej('invalid user_id param');

	// Get 'username' parameter
	const [username, usernameErr] = $(params.username).optional.string().$;
	if (usernameErr) return rej('invalid username param');

	// Get 'following' parameter
	const [following = null, followingErr] = $(params.following).optional.nullable.boolean().$;
	if (followingErr) return rej('invalid following param');

	// Get 'reply' parameter
	const [reply = null, replyErr] = $(params.reply).optional.nullable.boolean().$;
	if (replyErr) return rej('invalid reply param');

	// Get 'repost' parameter
	const [repost = null, repostErr] = $(params.repost).optional.nullable.boolean().$;
	if (repostErr) return rej('invalid repost param');

	// Get 'media' parameter
	const [media = null, mediaErr] = $(params.media).optional.nullable.boolean().$;
	if (mediaErr) return rej('invalid media param');

	// Get 'poll' parameter
	const [poll = null, pollErr] = $(params.poll).optional.nullable.boolean().$;
	if (pollErr) return rej('invalid poll param');

	// Get 'since_date' parameter
	const [sinceDate, sinceDateErr] = $(params.since_date).optional.number().$;
	if (sinceDateErr) throw 'invalid since_date param';

	// Get 'until_date' parameter
	const [untilDate, untilDateErr] = $(params.until_date).optional.number().$;
	if (untilDateErr) throw 'invalid until_date param';

	// Get 'offset' parameter
	const [offset = 0, offsetErr] = $(params.offset).optional.number().min(0).$;
	if (offsetErr) return rej('invalid offset param');

	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 30).$;
	if (limitErr) return rej('invalid limit param');

	let user = userId;

	if (user == null && username != null) {
		const _user = await User.findOne({
			username_lower: username.toLowerCase()
		});
		if (_user) {
			user = _user._id;
		}
	}

	// If Elasticsearch is available, search by it
	// If not, search by MongoDB
	(config.elasticsearch.enable ? byElasticsearch : byNative)
		(res, rej, me, text, user, following, reply, repost, media, poll, sinceDate, untilDate, offset, limit);
});

// Search by MongoDB
async function byNative(res, rej, me, text, userId, following, reply, repost, media, poll, sinceDate, untilDate, offset, max) {
	const q: any = {
		$and: []
	};

	const push = x => q.$and.push(x);

	if (text) {
		push({
			$and: text.split(' ').map(x => ({
				text: new RegExp(escapeRegexp(x))
			}))
		});
	}

	if (userId) {
		push({
			user_id: userId
		});
	}

	if (following != null && me != null) {
		const ids = await getFriends(me._id, false);
		push({
			user_id: following ? {
				$in: ids
			} : {
				$nin: ids.concat(me._id)
			}
		});
	}

	if (reply != null) {
		if (reply) {
			push({
				reply_id: {
					$exists: true,
					$ne: null
				}
			});
		} else {
			push({
				$or: [{
					reply_id: {
						$exists: false
					}
				}, {
					reply_id: null
				}]
			});
		}
	}

	if (repost != null) {
		if (repost) {
			push({
				repost_id: {
					$exists: true,
					$ne: null
				}
			});
		} else {
			push({
				$or: [{
					repost_id: {
						$exists: false
					}
				}, {
					repost_id: null
				}]
			});
		}
	}

	if (media != null) {
		if (media) {
			push({
				media_ids: {
					$exists: true,
					$ne: null
				}
			});
		} else {
			push({
				$or: [{
					media_ids: {
						$exists: false
					}
				}, {
					media_ids: null
				}]
			});
		}
	}

	if (poll != null) {
		if (poll) {
			push({
				poll: {
					$exists: true,
					$ne: null
				}
			});
		} else {
			push({
				$or: [{
					poll: {
						$exists: false
					}
				}, {
					poll: null
				}]
			});
		}
	}

	if (sinceDate) {
		push({
			created_at: {
				$gt: new Date(sinceDate)
			}
		});
	}

	if (untilDate) {
		push({
			created_at: {
				$lt: new Date(untilDate)
			}
		});
	}

	// Search posts
	const posts = await Post
		.find(q, {
			sort: {
				_id: -1
			},
			limit: max,
			skip: offset
		});

	// Serialize
	res(await Promise.all(posts.map(async post =>
		await serialize(post, me))));
}

// Search by Elasticsearch
async function byElasticsearch(res, rej, me, text, userId, following, reply, repost, media, poll, sinceDate, untilDate, offset, max) {
	const es = require('../../db/elasticsearch');

	es.search({
		index: 'misskey',
		type: 'post',
		body: {
			size: max,
			from: offset,
			query: {
				simple_query_string: {
					fields: ['text'],
					query: text,
					default_operator: 'and'
				}
			},
			sort: [
				{ _doc: 'desc' }
			],
			highlight: {
				pre_tags: ['<mark>'],
				post_tags: ['</mark>'],
				encoder: 'html',
				fields: {
					text: {}
				}
			}
		}
	}, async (error, response) => {
		if (error) {
			console.error(error);
			return res(500);
		}

		if (response.hits.total === 0) {
			return res([]);
		}

		const hits = response.hits.hits.map(hit => new mongo.ObjectID(hit._id));

		// Fetch found posts
		const posts = await Post
			.find({
				_id: {
					$in: hits
				}
			}, {
				sort: {
					_id: -1
				}
			});

		posts.map(post => {
			post._highlight = response.hits.hits.filter(hit => post._id.equals(hit._id))[0].highlight.text[0];
		});

		// Serialize
		res(await Promise.all(posts.map(async post =>
			await serialize(post, me))));
	});
}
