/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import $ from 'cafy';
const escapeRegexp = require('escape-regexp');
import Post from '../../models/post';
import User from '../../models/user';
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

	// Get 'include_replies' parameter
	const [includeReplies = true, includeRepliesErr] = $(params.include_replies).optional.boolean().$;
	if (includeRepliesErr) return rej('invalid include_replies param');

	// Get 'with_media' parameter
	const [withMedia = false, withMediaErr] = $(params.with_media).optional.boolean().$;
	if (withMediaErr) return rej('invalid with_media param');

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
		(res, rej, me, text, user, includeReplies, withMedia, sinceDate, untilDate, offset, limit);
});

// Search by MongoDB
async function byNative(res, rej, me, text, userId, includeReplies, withMedia, sinceDate, untilDate, offset, max) {
	const q: any = {};

	if (text) {
		q.$and = text.split(' ').map(x => ({
			text: new RegExp(escapeRegexp(x))
		}));
	}

	if (userId) {
		q.user_id = userId;
	}

	if (!includeReplies) {
		q.reply_id = null;
	}

	if (withMedia) {
		q.media_ids = {
			$exists: true,
			$ne: null
		};
	}

	if (sinceDate) {
		q.created_at = {
			$gt: new Date(sinceDate)
		};
	}

	if (untilDate) {
		if (q.created_at == undefined) q.created_at = {};
		q.created_at.$lt = new Date(untilDate);
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
async function byElasticsearch(res, rej, me, text, userId, includeReplies, withMedia, sinceDate, untilDate, offset, max) {
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
