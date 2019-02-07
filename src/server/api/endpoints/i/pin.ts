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

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	// Processing
	try {
		await addPinned(user, ps.noteId);
	} catch (e) {
		return rej(e.message);
	}

	// Serialize
	const iObj = await pack(user, user, {
		detail: true
	});

	// Send response
	res(iObj);
}));
