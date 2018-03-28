/**
 * Module dependencies
 */
import $ from 'cafy';
import * as bcrypt from 'bcryptjs';
import User from '../../models/user';

/**
 * Change password
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = async (params, user) => new Promise(async (res, rej) => {
	// Get 'current_password' parameter
	const [currentPassword, currentPasswordErr] = $(params.current_password).string().$;
	if (currentPasswordErr) return rej('invalid current_password param');

	// Get 'new_password' parameter
	const [newPassword, newPasswordErr] = $(params.new_password).string().$;
	if (newPasswordErr) return rej('invalid new_password param');

	// Compare password
	const same = await bcrypt.compare(currentPassword, user.account.password);

	if (!same) {
		return rej('incorrect password');
	}

	// Generate hash of password
	const salt = await bcrypt.genSalt(8);
	const hash = await bcrypt.hash(newPassword, salt);

	await User.update(user._id, {
		$set: {
			'account.password': hash
		}
	});

	res();
});
