import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import * as bcrypt from 'bcryptjs';
import rndstr from 'rndstr';
import { Users, UserProfiles } from '@/models/index';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		userId: {
			validator: $.type(ID),
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			password: {
				type: 'string',
				optional: false, nullable: false,
				minLength: 8,
				maxLength: 8,
			},
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps) => {
	const user = await Users.findOne(ps.userId as string);

	if (user == null) {
		throw new Error('user not found');
	}

	if (user.isAdmin) {
		throw new Error('cannot reset password of admin');
	}

	const passwd = rndstr('a-zA-Z0-9', 8);

	// Generate hash of password
	const hash = bcrypt.hashSync(passwd);

	await UserProfiles.update({
		userId: user.id,
	}, {
		password: hash,
	});

	return {
		password: passwd,
	};
});
