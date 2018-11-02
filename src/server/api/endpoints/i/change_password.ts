import $ from 'cafy';
import * as bcrypt from 'bcryptjs';
import User, { ILocalUser } from '../../../../models/user';
import getParams from '../../get-params';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		currentPassword: {
			validator: $.str
		},

		newPassword: {
			validator: $.str
		}
	}
};

export default async (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	// Compare password
	const same = await bcrypt.compare(ps.currentPassword, user.password);

	if (!same) {
		return rej('incorrect password');
	}

	// Generate hash of password
	const salt = await bcrypt.genSalt(8);
	const hash = await bcrypt.hash(ps.newPassword, salt);

	await User.update(user._id, {
		$set: {
			'password': hash
		}
	});

	res();
});
