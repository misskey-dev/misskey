/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import it from '../../it';
const escapeRegexp = require('escape-regexp');
import Post from '../../models/post';
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
	// Get 'query' parameter
	const [query, queryError] = it(params.query).expect.string().required().trim().validate(x => x != '').qed();
	if (queryError) return rej('invalid query param');

	// Get 'offset' parameter
	const [offset, offsetErr] = it(params.offset).expect.number().min(0).default(0).qed();
	if (offsetErr) return rej('invalid offset param');

	// Get 'max' parameter
	const [max, maxErr] = it(params.max).expect.number().range(1, 30).default(10).qed();
	if (maxErr) return rej('invalid max param');

	// If Elasticsearch is available, search by it
	// If not, search by MongoDB
	(config.elasticsearch.enable ? byElasticsearch : byNative)
		(res, rej, me, query, offset, max);
});

// Search by MongoDB
async function byNative(res, rej, me, query, offset, max) {
	const escapedQuery = escapeRegexp(query);

	// Search posts
	const posts = await Post
		.find({
			text: new RegExp(escapedQuery)
		}, {
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
async function byElasticsearch(res, rej, me, query, offset, max) {
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
					query: query,
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
