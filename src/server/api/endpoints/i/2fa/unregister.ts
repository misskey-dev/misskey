import $ from 'cafy';
import * as bcrypt from 'bcryptjs';
import User from '../../../../../models/user';
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

	await User.update(user._id, {
		$set: {
			'twoFactorSecret': null,
			'twoFactorEnabled': false
		}
	});

	res();
}));
