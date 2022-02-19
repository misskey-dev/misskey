import define from '../../../define';
import { UserProfiles } from '@/models/index';

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

const paramDef = {
	type: 'object',
	properties: {
		value: { type: 'boolean' },
	},
	required: ['value'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	await UserProfiles.update(user.id, {
		usePasswordLessLogin: ps.value,
	});
});
