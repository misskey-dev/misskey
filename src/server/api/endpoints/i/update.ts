/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../cafy-id';
import User, { isValidName, isValidDescription, isValidLocation, isValidBirthday, pack } from '../../../../models/user';
import event from '../../../../publishers/stream';
import DriveFile from '../../../../models/drive-file';

/**
 * Update myself
 */
module.exports = async (params, user, app) => new Promise(async (res, rej) => {
	const isSecure = user != null && app == null;

	const updates = {} as any;

	// Get 'name' parameter
	const [name, nameErr] = $.str.optional().nullable().pipe(isValidName).get(params.name);
	if (nameErr) return rej('invalid name param');
	if (name) updates.name = name;

	// Get 'description' parameter
	const [description, descriptionErr] = $.str.optional().nullable().pipe(isValidDescription).get(params.description);
	if (descriptionErr) return rej('invalid description param');
	if (description !== undefined) updates.description = description;

	// Get 'location' parameter
	const [location, locationErr] = $.str.optional().nullable().pipe(isValidLocation).get(params.location);
	if (locationErr) return rej('invalid location param');
	if (location !== undefined) updates.profile.location = location;

	// Get 'birthday' parameter
	const [birthday, birthdayErr] = $.str.optional().nullable().pipe(isValidBirthday).get(params.birthday);
	if (birthdayErr) return rej('invalid birthday param');
	if (birthday !== undefined) updates.profile.birthday = birthday;

	// Get 'avatarId' parameter
	const [avatarId, avatarIdErr] = $.type(ID).optional().get(params.avatarId);
	if (avatarIdErr) return rej('invalid avatarId param');
	if (avatarId) updates.avatarId = avatarId;

	// Get 'bannerId' parameter
	const [bannerId, bannerIdErr] = $.type(ID).optional().get(params.bannerId);
	if (bannerIdErr) return rej('invalid bannerId param');
	if (bannerId) updates.bannerId = bannerId;

	// Get 'isLocked' parameter
	const [isLocked, isLockedErr] = $.bool.optional().get(params.isLocked);
	if (isLockedErr) return rej('invalid isLocked param');
	if (isLocked != null) updates.isLocked = isLocked;

	// Get 'isBot' parameter
	const [isBot, isBotErr] = $.bool.optional().get(params.isBot);
	if (isBotErr) return rej('invalid isBot param');
	if (isBot != null) updates.isBot = isBot;

	// Get 'isCat' parameter
	const [isCat, isCatErr] = $.bool.optional().get(params.isCat);
	if (isCatErr) return rej('invalid isCat param');
	if (isCat != null) updates.isCat = isCat;

	// Get 'autoWatch' parameter
	const [autoWatch, autoWatchErr] = $.bool.optional().get(params.autoWatch);
	if (autoWatchErr) return rej('invalid autoWatch param');
	if (autoWatch != null) updates.settings.autoWatch = autoWatch;

	if (avatarId) {
		const avatar = await DriveFile.findOne({
			_id: avatarId
		});

		if (avatar != null && avatar.metadata.properties.avgColor) {
			updates.avatarColor = avatar.metadata.properties.avgColor;
		}
	}

	if (bannerId) {
		const banner = await DriveFile.findOne({
			_id: bannerId
		});

		if (banner != null && banner.metadata.properties.avgColor) {
			updates.bannerColor = banner.metadata.properties.avgColor;
		}
	}

	await User.update(user._id, {
		$set: updates
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

	// 鍵垢を解除したとき、溜まっていたフォローリクエストがあるならすべて承認
	if (user.isLocked && isLocked === false) {
		acceptAllFollowRequests(user);
	}
});
