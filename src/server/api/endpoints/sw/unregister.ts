import $ from 'cafy';
import define from '../../define';
import { SwSubscriptions } from '../../../../models';

export const meta = {
	tags: ['account'],

	requireCredential: true as const,

	desc: {
		'ja-JP': 'Push通知の登録を削除します。',
		'en-US': 'Remove push noticfication registration'
	},

	params: {
		endpoint: {
			validator: $.str
		},
	}
};

export default define(meta, async (ps, user) => {
	await SwSubscriptions.delete({
		userId: user.id,
		endpoint: ps.endpoint,
	});
});
