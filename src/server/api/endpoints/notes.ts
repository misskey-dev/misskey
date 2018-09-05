import $ from 'cafy'; import ID from '../../../misc/cafy-id';
import Note, { pack } from '../../../models/note';
import getParams from '../get-params';

export const meta = {
	desc: {
		'ja-JP': '投稿を取得します。'
	},

	params: {
		local: $.bool.optional.note({
			desc: {
				'ja-JP': 'ローカルの投稿に限定するか否か'
			}
		}),

		reply: $.bool.optional.note({
			desc: {
				'ja-JP': '返信に限定するか否か'
			}
		}),

		renote: $.bool.optional.note({
			desc: {
				'ja-JP': 'Renoteに限定するか否か'
			}
		}),

		withFiles: $.bool.optional.note({
			desc: {
				'ja-JP': 'ファイルが添付された投稿に限定するか否か'
			}
		}),

		media: $.bool.optional.note({
			desc: {
				'ja-JP': 'ファイルが添付された投稿に限定するか否か (このパラメータは廃止予定です。代わりに withFiles を使ってください。)'
			}
		}),

		poll: $.bool.optional.note({
			desc: {
				'ja-JP': 'アンケートが添付された投稿に限定するか否か'
			}
		}),

		limit: $.num.optional.range(1, 100).note({
			default: 10
		}),

		sinceId: $.type(ID).optional.note({}),

		untilId: $.type(ID).optional.note({}),
	}
};

export default (params: any) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) throw psErr;

	// Check if both of sinceId and untilId is specified
	if (ps.sinceId && ps.untilId) {
		return rej('cannot set sinceId and untilId');
	}

	// Construct query
	const sort = {
		_id: -1
	};
	const query = {
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

	if (withFiles) {
		query.fileIds = withFiles ? { $exists: true, $ne: null } : [];
	}

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
	res(await Promise.all(notes.map(note => pack(note))));
});
