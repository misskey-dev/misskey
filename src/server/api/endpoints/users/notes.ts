import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import getHostLower from '../../common/get-host-lower';
import Note, { packMany } from '../../../../models/note';
import User, { ILocalUser } from '../../../../models/user';
import getParams from '../../get-params';
import { countIf } from '../../../../prelude/array';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーのタイムラインを取得します。'
	},

	params: {
		userId: {
			validator: $.type(ID).optional,
			transform: transform,
			desc: {
				'ja-JP': 'ユーザーID'
			}
		},

		username: {
			validator: $.str.optional,
			desc: {
				'ja-JP': 'ユーザー名'
			}
		},

		host: {
			validator: $.str.optional,
		},

		includeReplies: {
			validator: $.bool.optional,
			default: true,

			desc: {
				'ja-JP': 'リプライを含めるか否か'
			}
		},

		limit: {
			validator: $.num.optional.range(1, 100),
			default: 10,
			desc: {
				'ja-JP': '最大数'
			}
		},

		sinceId: {
			validator: $.type(ID).optional,
			transform: transform,
			desc: {
				'ja-JP': '指定すると、この投稿を基点としてより新しい投稿を取得します'
			}
		},

		untilId: {
			validator: $.type(ID).optional,
			transform: transform,
			desc: {
				'ja-JP': '指定すると、この投稿を基点としてより古い投稿を取得します'
			}
		},

		sinceDate: {
			validator: $.num.optional,
			desc: {
				'ja-JP': '指定した時間を基点としてより新しい投稿を取得します。数値は、1970年1月1日 00:00:00 UTC から指定した日時までの経過時間をミリ秒単位で表します。'
			}
		},

		untilDate: {
			validator: $.num.optional,
			desc: {
				'ja-JP': '指定した時間を基点としてより古い投稿を取得します。数値は、1970年1月1日 00:00:00 UTC から指定した日時までの経過時間をミリ秒単位で表します。'
			}
		},

		includeMyRenotes: {
			validator: $.bool.optional,
			default: true,
			desc: {
				'ja-JP': '自分の行ったRenoteを含めるかどうか'
			}
		},

		includeRenotedMyNotes: {
			validator: $.bool.optional,
			default: true,
			desc: {
				'ja-JP': 'Renoteされた自分の投稿を含めるかどうか'
			}
		},

		includeLocalRenotes: {
			validator: $.bool.optional,
			default: true,
			desc: {
				'ja-JP': 'Renoteされたローカルの投稿を含めるかどうか'
			}
		},

		withFiles: {
			validator: $.bool.optional,
			default: false,
			desc: {
				'ja-JP': 'true にすると、ファイルが添付された投稿だけ取得します'
			}
		},

		mediaOnly: {
			validator: $.bool.optional,
			default: false,
			desc: {
				'ja-JP': 'true にすると、ファイルが添付された投稿だけ取得します (このパラメータは廃止予定です。代わりに withFiles を使ってください。)'
			}
		},

		fileType: {
			validator: $.arr($.str).optional,
			desc: {
				'ja-JP': '指定された種類のファイルが添付された投稿のみを取得します'
			}
		},
	}
};

export default (params: any, me: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	if (ps.userId === undefined && ps.username === undefined) {
		return rej('userId or username is required');
	}

	// Check if only one of sinceId, untilId, sinceDate, untilDate specified
	if (countIf(x => x != null, [ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate]) > 1) {
		throw 'only one of sinceId, untilId, sinceDate, untilDate can be specified';
	}

	const q = ps.userId != null
		? { _id: ps.userId }
		: { usernameLower: ps.username.toLowerCase(), host: getHostLower(ps.host) } ;

	// Lookup user
	const user = await User.findOne(q, {
		fields: {
			_id: true
		}
	});

	if (user === null) {
		return rej('user not found');
	}

	//#region Construct query
	const sort = {
		_id: -1
	};

	const query = {
		deletedAt: null,
		userId: user._id
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
	} else if (ps.sinceDate) {
		sort._id = 1;
		query.createdAt = {
			$gt: new Date(ps.sinceDate)
		};
	} else if (ps.untilDate) {
		query.createdAt = {
			$lt: new Date(ps.untilDate)
		};
	}

	if (!ps.includeReplies) {
		query.replyId = null;
	}

	const withFiles = ps.withFiles != null ? ps.withFiles : ps.mediaOnly;

	if (withFiles) {
		query.fileIds = {
			$exists: true,
			$ne: []
		};
	}

	if (ps.fileType) {
		query.fileIds = { $exists: true, $ne: [] };

		query['_files.contentType'] = {
			$in: ps.fileType
		};
	}
	//#endregion

	// Issue query
	const notes = await Note
		.find(query, {
			limit: ps.limit,
			sort: sort
		});

	// Serialize
	res(await packMany(notes, me));
});
