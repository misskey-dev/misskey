import $ from 'cafy'; import ID from '../../../../misc/cafy-id';
import { ILocalUser } from '../../../../models/user';
import { pack } from '../../../../models/user';
import { removePinned } from '../../../../services/i/pin';
import getParams from '../../get-params';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定した投稿のピン留めを解除します。'
	},

	requireCredential: true,

	kind: 'account-write',

	params: {
		noteId: $.type(ID).note({
			desc: {
				'ja-JP': '対象の投稿のID',
				'en-US': 'Target note ID'
			}
		})
	}
};

export default async (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	// Processing
	try {
		await removePinned(user, ps.noteId);
	} catch (e) {
		return rej(e.message);
	}

	// Serialize
	const iObj = await pack(user, user, {
		detail: true
	});

	// Send response
	res(iObj);
});
