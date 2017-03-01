'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import User from '../../models/user';
import serialize from '../../serializers/user';

/**
 * Show a user
 *
 * @param {any} params
 * @param {any} me
 * @return {Promise<any>}
 */
module.exports = (params, me) =>
	new Promise(async (res, rej) =>
{
	// Get 'user_id' parameter
	let userId = params.user_id;
	if (userId === undefined || userId === null || userId === '') {
		userId = null;
	}

	// Get 'username' parameter
	let username = params.username;
	if (username === undefined || username === null || username === '') {
		username = null;
	}

	if (userId === null && username === null) {
		return rej('user_id or username is required');
	}

	// Validate id
	if (userId && !mongo.ObjectID.isValid(userId)) {
		return rej('incorrect user_id');
	}

	const q = userId != null
		? { _id: new mongo.ObjectID(userId) }
		: { username_lower: username.toLowerCase() } ;

	// Lookup user
	const user = await User.findOne(q, {
		fields: {
			data: false
		}
	});

	if (user === null) {
		return rej('user not found');
	}

	// Send response
	res(await serialize(user, me, {
		detail: true
	}));
});
