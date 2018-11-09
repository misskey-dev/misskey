import $ from 'cafy';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import User from '../../../../../models/user';
import config from '../../../../../config';
import define from '../../../define';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		password: {
			validator: $.str
		}
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	// Compare password
	const same = await bcrypt.compare(ps.password, user.password);

	if (!same) {
		return rej('incorrect password');
	}

	// Generate user's secret key
	const secret = speakeasy.generateSecret({
		length: 32
	});

	await User.update(user._id, {
		$set: {
			twoFactorTempSecret: secret.base32
		}
	});

	// Get the data URL of the authenticator URL
	QRCode.toDataURL(speakeasy.otpauthURL({
		secret: secret.base32,
		encoding: 'base32',
		label: user.username,
		issuer: config.host
	}), (err, data_url) => {
		res({
			qr: data_url,
			secret: secret.base32,
			label: user.username,
			issuer: config.host
		});
	});
}));
