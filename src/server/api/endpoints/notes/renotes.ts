import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import Note, { packMany } from '../../../../models/note';
import define from '../../define';

export const meta = {
	desc: {
		'ja-JP': '指定した投稿のRenote一覧を取得します。',
		'en-US': 'Show a renotes of a note.'
	},

	requireCredential: false,

	params: {
		noteId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象の投稿のID',
				'en-US': 'Target note ID'
			}
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		sinceId: {
			validator: $.optional.type(ID),
			transform: transform,
		},

		untilId: {
			validator: $.optional.type(ID),
			transform: transform,
		}
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
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

	const sort = {
		_id: -1
	};

	const query = {
		renoteId: note._id
	} as any;

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

	const renotes = await Note
		.find(query, {
			limit: ps.limit,
			sort: sort
		});

	res(await packMany(renotes, user));
}));
