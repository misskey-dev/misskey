/**
 * Module dependencies
 */
import $ from 'cafy';
import User, { isValidName, isValidDescription, isValidLocation, isValidBirthday, pack } from '../../models/user';
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
	const [name, nameErr] = $(params.name).optional.string().pipe(isValidName).$;
	if (nameErr) return rej('invalid name param');
	if (name) user.name = name;

	// Get 'description' parameter
	const [description, descriptionErr] = $(params.description).optional.nullable.string().pipe(isValidDescription).$;
	if (descriptionErr) return rej('invalid description param');
	if (description !== undefined) user.description = description;

	// Get 'location' parameter
	const [location, locationErr] = $(params.location).optional.nullable.string().pipe(isValidLocation).$;
	if (locationErr) return rej('invalid location param');
	if (location !== undefined) user.profile.location = location;

	// Get 'birthday' parameter
	const [birthday, birthdayErr] = $(params.birthday).optional.nullable.string().pipe(isValidBirthday).$;
	if (birthdayErr) return rej('invalid birthday param');
	if (birthday !== undefined) user.profile.birthday = birthday;

	// Get 'avatar_id' parameter
	const [avatarId, avatarIdErr] = $(params.avatar_id).optional.id().$;
	if (avatarIdErr) return rej('invalid avatar_id param');
	if (avatarId) user.avatar_id = avatarId;

	// Get 'banner_id' parameter
	const [bannerId, bannerIdErr] = $(params.banner_id).optional.id().$;
	if (bannerIdErr) return rej('invalid banner_id param');
	if (bannerId) user.banner_id = bannerId;

	// Get 'is_bot' parameter
	const [isBot, isBotErr] = $(params.is_bot).optional.boolean().$;
	if (isBotErr) return rej('invalid is_bot param');
	if (isBot) user.is_bot = isBot;

	await User.update(user._id, {
		$set: {
			name: user.name,
			description: user.description,
			avatar_id: user.avatar_id,
			banner_id: user.banner_id,
			profile: user.profile,
			is_bot: user.is_bot
		}
	});

	// Serialize
	const iObj = await pack(user, user, {
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
