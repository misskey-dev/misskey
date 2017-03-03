/**
 * Module dependencies
 */
import it from '../../it';
import User from '../../models/user';
import { isValidName, isValidDescription, isValidLocation, isValidBirthday } from '../../models/user';
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
module.exports = async (params, user, _, isSecure) => new Promise(async (res, rej) => {
	// Get 'name' parameter
	const [name, nameErr] = it(params.name).expect.string().validate(isValidName).qed();
	if (nameErr) return rej('invalid name param');
	if (name) user.name = name;

	// Get 'description' parameter
	const [description, descriptionErr] = it(params.description).expect.nullable.string().validate(isValidDescription).qed();
	if (descriptionErr) return rej('invalid description param');
	if (description !== undefined) user.description = description;

	// Get 'location' parameter
	const [location, locationErr] = it(params.location).expect.nullable.string().validate(isValidLocation).qed();
	if (locationErr) return rej('invalid location param');
	if (location !== undefined) user.location = location;

	// Get 'birthday' parameter
	const [birthday, birthdayErr] = it(params.birthday).expect.nullable.string().validate(isValidBirthday).qed();
	if (birthdayErr) return rej('invalid birthday param');
	if (birthday !== undefined) user.birthday = birthday;

	// Get 'avatar_id' parameter
	const [avatarId, avatarIdErr] = it(params.avatar_id).expect.id().qed();
	if (avatarIdErr) return rej('invalid avatar_id param');
	if (avatarId) user.avatar_id = avatarId;

	// Get 'banner_id' parameter
	const [bannerId, bannerIdErr] = it(params.banner_id).expect.id().qed();
	if (bannerIdErr) return rej('invalid banner_id param');
	if (bannerId) user.banner_id = bannerId;

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
