import $ from 'cafy';
import * as bcrypt from 'bcryptjs';
import define from '../../define';
import { Users, UserProfiles } from '../../../../models';
import { ensure } from '../../../../prelude/ensure';
import { doPostSuspend } from '../../../../services/suspend-user';

export const meta = {
	requireCredential: true as const,

	secure: true,

	params: {
		password: {
			validator: $.str
		},
	}
};

export default define(meta, async (ps, user) => {
	const profile = await UserProfiles.findOne(user.id).then(ensure);

	// Compare password
	const same = await bcrypt.compare(ps.password, profile.password!);

	if (!same) {
		throw new Error('incorrect password');
	}

	// 物理削除する前にDelete activityを送信する
	await doPostSuspend(user).catch(e => {});

	await Users.delete(user.id);
});
