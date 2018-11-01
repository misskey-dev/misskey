import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Note, { packMany } from '../../../../models/note';
import { ILocalUser } from '../../../../models/user';
import getParams from '../../get-params';

export const meta = {
	desc: {
		'ja-JP': '指定した投稿への返信を取得します。',
		'en-US': 'Get replies of a note.'
	},

	requireCredential: false,

	params: {
		noteId: {
			validator: $.type(ID),
			transform: transform,
		},

		limit: {
			validator: $.num.optional.range(1, 100),
			default: 10
		},

		offset: {
			validator: $.num.optional.min(0),
			default: 0
		},
	}
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	// Lookup note
	const note = await Note.findOne({
		_id: ps.noteId
	});

	if (note === null) {
		return rej('note not found');
	}

	const ids = (note._replyIds || []).slice(ps.offset, ps.offset + ps.limit);

	res(await packMany(ids, user));
});
