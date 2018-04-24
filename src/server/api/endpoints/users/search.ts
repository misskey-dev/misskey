/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import $ from 'cafy'; import ID from '../../../../cafy-id';
import User, { pack } from '../../../../models/user';
import config from '../../../../config';
const escapeRegexp = require('escape-regexp');

/**
 * Search a user
 *
 * @param {any} params
 * @param {any} me
 * @return {Promise<any>}
 */
module.exports = (params, me) => new Promise(async (res, rej) => {
	// Get 'query' parameter
	const [query, queryError] = $(params.query).string().pipe(x => x != '').$;
	if (queryError) return rej('invalid query param');

	// Get 'offset' parameter
	const [offset = 0, offsetErr] = $(params.offset).optional.number().min(0).$;
	if (offsetErr) return rej('invalid offset param');

	// Get 'max' parameter
	const [max = 10, maxErr] = $(params.max).optional.number().range(1, 30).$;
	if (maxErr) return rej('invalid max param');

	// If Elasticsearch is available, search by $
	// If not, search by MongoDB
	(config.elasticsearch.enable ? byElasticsearch : byNative)
		(res, rej, me, query, offset, max);
});

// Search by MongoDB
async function byNative(res, rej, me, query, offset, max) {
	const escapedQuery = escapeRegexp(query);

	// Search users
	const users = await User
		.find({
			$or: [{
				usernameLower: new RegExp(escapedQuery.replace('@', '').toLowerCase())
			}, {
				name: new RegExp(escapedQuery)
			}]
		}, {
			limit: max
		});

	// Serialize
	res(await Promise.all(users.map(async user =>
		await pack(user, me, { detail: true }))));
}

// Search by Elasticsearch
async function byElasticsearch(res, rej, me, query, offset, max) {
	const es = require('../../db/elasticsearch');

	es.search({
		index: 'misskey',
		type: 'user',
		body: {
			size: max,
			from: offset,
			query: {
				simple_query_string: {
					fields: ['username', 'name', 'bio'],
					query: query,
					default_operator: 'and'
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

		const users = await User
			.find({
				_id: {
					$in: hits
				}
			});

		// Serialize
		res(await Promise.all(users.map(async user =>
			await pack(user, me, { detail: true }))));
	});
}
