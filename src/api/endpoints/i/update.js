'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import User from '../../models/user';
import { isValidBirthday } from '../../models/user';
import serialize from '../../serializers/user';
import event from '../../event';
import config from '../../../conf';

/**
 * Update myself
 *
 * @param {any} params
 * @param {any} user
 * @param {any} _
 * @param {boolean} isSecure
 * @return {Promise<any>}
 */
module.exports = async (params, user, _, isSecure) =>
	new Promise(async (res, rej) =>
{
	// Get 'name' parameter
	const name = params.name;
	if (name !== undefined && name !== null) {
		if (name.length > 50) {
			return rej('too long name');
		}

		user.name = name;
	}

	// Get 'description' parameter
	const description = params.description;
	if (description !== undefined && description !== null) {
		if (description.length > 500) {
			return rej('too long description');
		}

		user.description = description;
	}

	// Get 'location' parameter
	const location = params.location;
	if (location !== undefined && location !== null) {
		if (location.length > 50) {
			return rej('too long location');
		}

		user.profile.location = location;
	}

	// Get 'birthday' parameter
	const birthday = params.birthday;
	if (birthday != null) {
		if (!isValidBirthday(birthday)) {
			return rej('invalid birthday');
		}

		user.profile.birthday = birthday;
	} else {
		user.profile.birthday = null;
	}

	// Get 'avatar_id' parameter
	const avatar = params.avatar_id;
	if (avatar !== undefined && avatar !== null) {
		user.avatar_id = new mongo.ObjectID(avatar);
	}

	// Get 'banner_id' parameter
	const banner = params.banner_id;
	if (banner !== undefined && banner !== null) {
		user.banner_id = new mongo.ObjectID(banner);
	}

	await User.update(user._id, {
		$set: {
			name: user.name,
			description: user.description,
			avatar_id: user.avatar_id,
			banner_id: user.banner_id,
			profile: user.profile
		}
	});

	// Serialize
	const iObj = await serialize(user, user, {
		detail: true,
		includeSecrets: isSecure
	});

	// Send response
	res(iObj);

	// Publish i updated event
	event(user._id, 'i_updated', iObj);

	// Update search index
	if (config.elasticsearch.enable) {
		const es = require('../../../db/elasticsearch');

		es.index({
			index: 'misskey',
			type: 'user',
			id: user._id.toString(),
			body: {
				name: user.name,
				bio: user.bio
			}
		});
	}
});
