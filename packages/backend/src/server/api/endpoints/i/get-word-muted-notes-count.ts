import define from '../../define';
import { MutedNotes } from '@/models/index';

export const meta = {
	tags: ['account'],

	requireCredential: true as const,

	kind: 'read:account',

	params: {
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		properties: {
			count: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
			},
		},
	},
};

export default define(meta, async (ps, user) => {
	return {
		count: await MutedNotes.count({
			userId: user.id,
			reason: 'word',
		}),
	};
});
