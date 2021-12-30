import $ from 'cafy';
import define from '../../define';
import { validateEmailForAccount } from '@/services/validate-email-for-account';

export const meta = {
	tags: ['users'],

	requireCredential: false as const,

	params: {
		emailAddress: {
			validator: $.str,
		},
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		properties: {
			available: {
				type: 'boolean' as const,
				optional: false as const, nullable: false as const,
			},
			reason: {
				type: 'string' as const,
				optional: false as const, nullable: true as const,
			},
		},
	},
};

export default define(meta, async (ps) => {
	return await validateEmailForAccount(ps.emailAddress);
});
