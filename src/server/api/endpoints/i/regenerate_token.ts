/**
 * Module dependencies
 */
import $ from 'cafy';
import * as bcrypt from 'bcryptjs';
import User from '../../../../models/user';
import event from '../../event';
import generateUserToken from '../../common/generate-native-user-token';

/**
 * Regenerate native token
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = async (params, user) => new Promise(async (res, rej) => {
	// Get 'password' parameter
	const [password, passwordErr] = $(params.password).string().$;
	if (passwordErr) return rej('invalid password param');

	// Compare password
	const same = await bcrypt.compare(password, user.account.password);

	if (!same) {
		return rej('incorrect password');
	}

	// Generate secret
	const secret = generateUserToken();

	await User.update(user._id, {
		$set: {
			'account.token': secret
		}
	});

	res();

	// Publish event
	event(user._id, 'my_token_regenerated');
});
