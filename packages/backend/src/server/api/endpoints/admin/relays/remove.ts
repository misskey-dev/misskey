import define from '../../../define';
import { removeRelay } from '@/services/relay';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
} as const;

const paramDef = {
	type: 'object',
	properties: {
		inbox: { type: 'string' },
	},
	required: ['inbox'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	return await removeRelay(ps.inbox);
});
