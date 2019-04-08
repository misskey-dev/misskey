import $ from 'cafy';
import * as speakeasy from 'speakeasy';
import define from '../../../define';
import { Users } from '../../../../../models';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		token: {
			validator: $.str
		}
	}
};

export default define(meta, async (ps, user) => {
	const _token = ps.token.replace(/\s/g, '');

	if (user.twoFactorTempSecret == null) {
		throw new Error('二段階認証の設定が開始されていません');
	}

	const verified = (speakeasy as any).totp.verify({
		secret: user.twoFactorTempSecret,
		encoding: 'base32',
		token: _token
	});

	if (!verified) {
		throw new Error('not verified');
	}

	await Users.update(user.id, {
		twoFactorSecret: user.twoFactorTempSecret,
		twoFactorEnabled: true
	});
});
