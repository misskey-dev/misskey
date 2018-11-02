import $ from 'cafy';
import * as bcrypt from 'bcryptjs';
import User, { ILocalUser } from '../../../../../models/user';
import getParams from '../../../get-params';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		password: {
			validator: $.str
		}
	}
};

export default async (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	// Compare password
	const same = await bcrypt.compare(ps.password, user.password);

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
