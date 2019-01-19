import $ from 'cafy';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import User from '../../../../../models/user';
import config from '../../../../../config';
import define from '../../../define';
import { error } from '../../../../../prelude/promise';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		password: {
			validator: $.str
		}
	}
};

export default define(meta, (ps, user) => bcrypt.compare(ps.password, user.password)
	.then(x =>
		!x ? error('incorrect password') : {
			secret: speakeasy.generateSecret({ length: 32 }).base32,
			label: user.username,
			issuer: config.host
		})
	.then(x => User.update(user._id, {
		$set: { twoFactorTempSecret: x.secret }
	})
	.then(() => QRCode.toDataURL(speakeasy.otpauthURL({ ...x, encoding: 'base32' })))
	.then((qr => ({ ...x, qr })))));
