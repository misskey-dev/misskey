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

		all: {
			validator: $.optional.bool,
			default: false,
			desc: {
				'ja-JP': 'false（デフォルト）は、自分の登録のみが解除されます。trueを指定すると、指定したエンドポイントのすべての登録を解除します。'
			}
		}
	}
};

export default define(meta, async (ps, user) => {
	await SwSubscriptions.delete(ps.all ? {
		endpoint: ps.endpoint,
	} : {
		userId: user.id,
		endpoint: ps.endpoint,
	});
});
