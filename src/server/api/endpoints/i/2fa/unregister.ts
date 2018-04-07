/**
 * Module dependencies
 */
import $ from 'cafy';
import * as bcrypt from 'bcryptjs';
import User from '../../../../../models/user';

module.exports = async (params, user) => new Promise(async (res, rej) => {
	// Get 'password' parameter
	const [password, passwordErr] = $(params.password).string().$;
	if (passwordErr) return rej('invalid password param');

	// Compare password
	const same = await bcrypt.compare(password, user.password);

	if (!same) {
		return rej('incorrect password');
	}

	await User.update(user._id, {
		$set: {
			'twoFactorSecret': null,
			'twoFactorEnabled': false
		}
	});

	res();
});
