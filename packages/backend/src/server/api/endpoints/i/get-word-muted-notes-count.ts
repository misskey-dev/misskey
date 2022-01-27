import define from '../../define';
import { MutedNotes } from '@/models/index';

export const meta = {
	tags: ['account'],

	requireCredential: true,

	kind: 'read:account',

	params: {
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			count: {
				type: 'number',
				optional: false, nullable: false,
			},
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	return {
		count: await MutedNotes.count({
			userId: user.id,
			reason: 'word',
		}),
	};
});
