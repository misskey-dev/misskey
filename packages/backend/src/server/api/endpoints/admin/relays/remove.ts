import $ from 'cafy';
import define from '../../../define';
import { removeRelay } from '@/services/relay';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true as const,

	params: {
		inbox: {
			validator: $.str,
		},
	},
};

export default define(meta, async (ps, user) => {
	return await removeRelay(ps.inbox);
});
