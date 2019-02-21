import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import { pack } from '../../../../models/user';
import { addPinned } from '../../../../services/i/pin';
import define from '../../define';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定した投稿をピン留めします。'
	},

	requireCredential: true,

	kind: 'account-write',

	params: {
		noteId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象の投稿のID',
				'en-US': 'Target note ID'
			}
		}
	}
};

export default define(meta, async (ps, user) => {
	await addPinned(user, ps.noteId);

	return await pack(user, user, {
		detail: true
	});
});
