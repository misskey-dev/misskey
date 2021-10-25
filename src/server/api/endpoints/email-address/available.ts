import $ from 'cafy';
import define from '../../define';
import { UserProfiles } from '@/models/index';

export const meta = {
	tags: ['users'],

	requireCredential: false as const,

	params: {
		emailAddress: {
			validator: $.str
		}
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		properties: {
			available: {
				type: 'boolean' as const,
				optional: false as const, nullable: false as const,
			}
		}
	}
};

export default define(meta, async (ps) => {
	const exist = await UserProfiles.count({
		emailVerified: true,
		email: ps.emailAddress,
	});

	return {
		available: exist === 0
	};
});
