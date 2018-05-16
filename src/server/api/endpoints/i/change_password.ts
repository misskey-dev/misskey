/**
 * Module dependencies
 */
import $ from 'cafy';
import * as bcrypt from 'bcryptjs';
import User from '../../../../models/user';

/**
 * Change password
 */
module.exports = async (params, user) => new Promise(async (res, rej) => {
	// Get 'currentPasword' parameter
	const [currentPassword, currentPasswordErr] = $.str.get(params.currentPasword);
	if (currentPasswordErr) return rej('invalid currentPasword param');

	// Get 'newPassword' parameter
	const [newPassword, newPasswordErr] = $.str.get(params.newPassword);
	if (newPasswordErr) return rej('invalid newPassword param');

	// Compare password
	const same = await bcrypt.compare(currentPassword, user.password);

	if (!same) {
		return rej('incorrect password');
	}

	// Generate hash of password
	const salt = await bcrypt.genSalt(8);
	const hash = await bcrypt.hash(newPassword, salt);

	await User.update(user._id, {
		$set: {
			'password': hash
		}
	});

	res();
});
