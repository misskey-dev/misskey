import $ from 'cafy'; import ID from '../../../../misc/cafy-id';
import Note from '../../../../models/note';
import Reaction, { pack } from '../../../../models/note-reaction';
import { ILocalUser } from '../../../../models/user';
import getParams from '../../get-params';

export const meta = {
	desc: {
		'ja-JP': '指定した投稿のリアクション一覧を取得します。',
		'en-US': 'Show reactions of a note.'
	},

	requireCredential: false,

	params: {
		noteId: $.type(ID).note({
		}),

		limit: $.num.optional.range(1, 100).note({
			default: 10
		}),

		offset: $.num.optional.note({
			default: 0
		}),

		sinceId: $.type(ID).optional.note({
		}),

		untilId: $.type(ID).optional.note({
		}),
	}
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	// Check if both of sinceId and untilId is specified
	if (ps.sinceId && ps.untilId) {
		return rej('cannot set sinceId and untilId');
	}

	// Lookup note
	const note = await Note.findOne({
		_id: ps.noteId
	});

	if (note === null) {
		return rej('note not found');
	}

	const query = {
		noteId: note._id
	} as any;

	const sort = {
		_id: -1
	};

	if (ps.sinceId) {
		sort._id = 1;
		query._id = {
			$gt: ps.sinceId
		};
	} else if (ps.untilId) {
		query._id = {
			$lt: ps.untilId
		};
	}

	const reactions = await Reaction
		.find(query, {
			limit: ps.limit,
			skip: ps.offset,
			sort: sort
		});

	// Serialize
	res(await Promise.all(reactions.map(reaction => pack(reaction, user))));
});
