/**
 * Module dependencies
 */
import $ from 'cafy';
import * as speakeasy from 'speakeasy';
import User from '../../../models/user';

module.exports = async (params, user) => new Promise(async (res, rej) => {
	// Get 'token' parameter
	const [token, tokenErr] = $(params.token).string().$;
	if (tokenErr) return rej('invalid token param');

	const _token = token.replace(/\s/g, '');

	if (user.two_factor_temp_secret == null) {
		return rej('二段階認証の設定が開始されていません');
	}

	const verified = (speakeasy as any).totp.verify({
		secret: user.two_factor_temp_secret,
		encoding: 'base32',
		token: _token
	});

	if (!verified) {
		return rej('not verified');
	}

	await User.update(user._id, {
		$set: {
			'account.two_factor_secret': user.two_factor_temp_secret,
			'account.two_factor_enabled': true
		}
	});

	res();
});
