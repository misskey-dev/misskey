import $ from 'cafy';
import ID, { transform } from '../../../misc/cafy-id';
import Note, { packMany } from '../../../models/note';
import define from '../define';

export const meta = {
	desc: {
		'ja-JP': '投稿を取得します。'
	},

	params: {
		local: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': 'ローカルの投稿に限定するか否か'
			}
		},

		reply: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': '返信に限定するか否か'
			}
		},

		renote: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': 'Renoteに限定するか否か'
			}
		},

		withFiles: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': 'ファイルが添付された投稿に限定するか否か'
			}
		},

		media: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': 'ファイルが添付された投稿に限定するか否か (このパラメータは廃止予定です。代わりに withFiles を使ってください。)'
			}
		},

		poll: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': 'アンケートが添付された投稿に限定するか否か'
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
		},
	}
};

export default define(meta, (ps) => new Promise(async (res, rej) => {
	// Check if both of sinceId and untilId is specified
	if (ps.sinceId && ps.untilId) {
		return rej('cannot set sinceId and untilId');
	}

	// Construct query
	const sort = {
		_id: -1
	};
	const query = {
		deletedAt: null,
		visibility: 'public'
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

	if (ps.local) {
		query['_user.host'] = null;
	}

	if (ps.reply != undefined) {
		query.replyId = ps.reply ? { $exists: true, $ne: null } : null;
	}

	if (ps.renote != undefined) {
		query.renoteId = ps.renote ? { $exists: true, $ne: null } : null;
	}

	const withFiles = ps.withFiles != undefined ? ps.withFiles : ps.media;

	if (withFiles) query.fileIds = { $exists: true, $ne: null };

	if (ps.poll != undefined) {
		query.poll = ps.poll ? { $exists: true, $ne: null } : null;
	}

	// TODO
	//if (bot != undefined) {
	//	query.isBot = bot;
	//}

	// Issue query
	const notes = await Note
		.find(query, {
			limit: ps.limit,
			sort: sort
		});

	// Serialize
	res(await packMany(notes));
}));
