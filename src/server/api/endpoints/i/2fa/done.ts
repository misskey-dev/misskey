import $ from 'cafy';
import * as speakeasy from 'speakeasy';
import User, { ILocalUser } from '../../../../../models/user';
import getParams from '../../../get-params';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		token: {
			validator: $.str
		}
	}
};

export default async (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

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
});
