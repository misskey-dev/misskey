import $ from 'cafy';
import * as speakeasy from 'speakeasy';
import User from '../../../../../models/user';
import define from '../../../define';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		token: {
			validator: $.str
		}
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	const _token = ps.token.replace(/\s/g, '');

	if (user.twoFactorTempSecret == null) {
		return rej('二段階認証の設定が開始されていません');
	}

	const verified = (speakeasy as any).totp.verify({
		secret: user.twoFactorTempSecret,
		encoding: 'base32',
		token: _token
	});

	if (!verified) {
		return rej('not verified');
	}

	await User.update(user._id, {
		$set: {
			'twoFactorSecret': user.twoFactorTempSecret,
			'twoFactorEnabled': true
		}
	});

	res();
}));
