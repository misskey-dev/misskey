import $ from 'cafy';
import define from '../../../define.js';
import { removeRelay } from '@/services/relay.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true as const,

	params: {
		inbox: {
			validator: $.str
		},
	},
};

export default define(meta, async (ps, user) => {
	return await removeRelay(ps.inbox);
});
