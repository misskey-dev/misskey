import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import { pack } from '../../../../models/user';
import { addPinned } from '../../../../services/i/pin';
import define from '../../define';
import { error } from '../../../../prelude/promise';

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

export default define(meta, (ps, user) => addPinned(user, ps.noteId)
	.catch(e => error(e.message))
	.then(() => pack(user, user, { detail: true })));
