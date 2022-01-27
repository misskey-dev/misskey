import $ from 'cafy';
import define from '../../define';
import { validateEmailForAccount } from '@/services/validate-email-for-account';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	params: {
		emailAddress: {
			validator: $.str,
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			available: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			reason: {
				type: 'string',
				optional: false, nullable: true,
			},
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps) => {
	return await validateEmailForAccount(ps.emailAddress);
});
