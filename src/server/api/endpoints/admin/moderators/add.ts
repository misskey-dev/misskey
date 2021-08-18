import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../../define';
import { Users } from '../../../../../models';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireAdmin: true,

	params: {
		userId: {
			validator: $.type(ID),
		},
	}
};

export default define(meta, async (ps) => {
	const user = await Users.findOne(ps.userId as string);

	if (user == null) {
		throw new Error('user not found');
	}

	if (user.isAdmin) {
		throw new Error('cannot mark as moderator if admin user');
	}

	await Users.update(user.id, {
		isModerator: true
	});
});
