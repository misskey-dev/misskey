'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import Post from '../../models/post';
import serialize from '../../serializers/post';
const escapeRegexp = require('escape-regexp');

/**
 * Search a post
 *
 * @param {Object} params
 * @param {Object} me
 * @return {Promise<object>}
 */
module.exports = (params, me) =>
	new Promise(async (res, rej) =>
{
	// Get 'query' parameter
	let query = params.query;
	if (query === undefined || query === null || query.trim() === '') {
		return rej('query is required');
	}

	// Get 'offset' parameter
	let offset = params.offset;
	if (offset !== undefined && offset !== null) {
		offset = parseInt(offset, 10);
	} else {
		offset = 0;
	}

	// Get 'max' parameter
	let max = params.max;
	if (max !== undefined && max !== null) {
		max = parseInt(max, 10);

		// From 1 to 30
		if (!(1 <= max && max <= 30)) {
			return rej('invalid max range');
		}
	} else {
		max = 10;
	}

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
		})
		.toArray();

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

		// Fetxh found posts
		const posts = await Post
			.find({
				_id: {
					$in: hits
				}
			}, {}, {
				sort: {
					_id: -1
				}
			})
			.toArray();

		posts.map(post => {
			post._highlight = response.hits.hits.filter(hit => post._id.equals(hit._id))[0].highlight.text[0];
		});

		// Serialize
		res(await Promise.all(posts.map(async post =>
			await serialize(post, me))));
	});
}
