import $ from 'cafy';
import * as bcrypt from 'bcryptjs';
import define from '../../define';
import { Users, UserProfiles } from '../../../../models';
import { ensure } from '../../../../misc/ensure';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		password: {
			validator: $.str
		},
	}
};

export default define(meta, async (ps, user) => {
	const profile = await UserProfiles.findOne({ userId: user.id }).then(ensure);

	// Compare password
	const same = await bcrypt.compare(ps.password, profile.password!);

	if (!same) {
		throw new Error('incorrect password');
	}

	await Users.delete(user.id);
});
