'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import User from '../../models/user';
import serialize from '../../serializers/user';
import config from '../../../conf';
const escapeRegexp = require('escape-regexp');

/**
 * Search a user
 *
 * @param {any} params
 * @param {any} me
 * @return {Promise<any>}
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

	// Search users
	const users = await User
		.find({
			$or: [{
				username_lower: new RegExp(escapedQuery.toLowerCase())
			}, {
				name: new RegExp(escapedQuery)
			}]
		}, {
			limit: max
		});

	// Serialize
	res(await Promise.all(users.map(async user =>
		await serialize(user, me, { detail: true }))));
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
			await serialize(user, me, { detail: true }))));
	});
}
