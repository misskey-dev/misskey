import $ from 'cafy';
import define from '../../../define';
import { removeRelay } from '../../../../../services/relay';

export const meta = {
	desc: {
		'ja-JP': 'リレーを削除します。',
		'en-US': 'Remove relay'
	},

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
