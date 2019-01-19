import $ from 'cafy';
import { totp } from 'speakeasy';
import User from '../../../../../models/user';
import define from '../../../define';
import { error, errorWhen } from '../../../../../prelude/promise';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		token: {
			validator: $.str
		}
	}
};

export default define(meta, (ps, user) => errorWhen(
	!user.twoFactorTempSecret,
	'二段階認証の設定が開始されていません')
	.then(() => !totp.verify({
			secret: user.twoFactorTempSecret,
			encoding: 'base32',
			token: ps.token.replace(/\s/g, '')
		}) ? error('not verified') :
		User.update(user._id, {
			$set: {
				'twoFactorSecret': user.twoFactorTempSecret,
				'twoFactorEnabled': true
			}
		}))
	.then(() => {}));
