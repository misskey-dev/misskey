import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import getHostLower from '../../common/get-host-lower';
import Note, { packMany } from '../../../../models/note';
import User from '../../../../models/user';
import define from '../../define';
import { countIf } from '../../../../prelude/array';
import Following from '../../../../models/following';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーのタイムラインを取得します。'
	},

	params: {
		userId: {
			validator: $.optional.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のユーザーのID',
				'en-US': 'Target user ID'
			}
		},

		username: {
			validator: $.optional.str,
			desc: {
				'ja-JP': 'ユーザー名'
			}
		},

		host: {
			validator: $.optional.nullable.str,
		},

		includeReplies: {
			validator: $.optional.bool,
			default: true,

			desc: {
				'ja-JP': 'リプライを含めるか否か'
			}
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10,
			desc: {
				'ja-JP': '最大数'
			}
		},

		sinceId: {
			validator: $.optional.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '指定すると、この投稿を基点としてより新しい投稿を取得します'
			}
		},

		untilId: {
			validator: $.optional.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '指定すると、この投稿を基点としてより古い投稿を取得します'
			}
		},

		sinceDate: {
			validator: $.optional.num,
			desc: {
				'ja-JP': '指定した時間を基点としてより新しい投稿を取得します。数値は、1970年1月1日 00:00:00 UTC から指定した日時までの経過時間をミリ秒単位で表します。'
			}
		},

		untilDate: {
			validator: $.optional.num,
			desc: {
				'ja-JP': '指定した時間を基点としてより古い投稿を取得します。数値は、1970年1月1日 00:00:00 UTC から指定した日時までの経過時間をミリ秒単位で表します。'
			}
		},

		includeMyRenotes: {
			validator: $.optional.bool,
			default: true,
			desc: {
				'ja-JP': '自分の行ったRenoteを含めるかどうか'
			}
		},

		includeRenotedMyNotes: {
			validator: $.optional.bool,
			default: true,
			desc: {
				'ja-JP': 'Renoteされた自分の投稿を含めるかどうか'
			}
		},

		includeLocalRenotes: {
			validator: $.optional.bool,
			default: true,
			desc: {
				'ja-JP': 'Renoteされたローカルの投稿を含めるかどうか'
			}
		},

		withFiles: {
			validator: $.optional.bool,
			default: false,
			desc: {
				'ja-JP': 'true にすると、ファイルが添付された投稿だけ取得します'
			}
		},

		mediaOnly: {
			validator: $.optional.bool,
			default: false,
			desc: {
				'ja-JP': 'true にすると、ファイルが添付された投稿だけ取得します (このパラメータは廃止予定です。代わりに withFiles を使ってください。)'
			}
		},

		fileType: {
			validator: $.optional.arr($.str),
			desc: {
				'ja-JP': '指定された種類のファイルが添付された投稿のみを取得します'
			}
		},

		excludeNsfw: {
			validator: $.optional.bool,
			default: false,
			desc: {
				'ja-JP': 'true にすると、NSFW指定されたファイルを除外します(fileTypeが指定されている場合のみ有効)'
			}
		},
	}
};

export default define(meta, (ps, me) => new Promise(async (res, rej) => {
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

	const isFollowing = me == null ? false : ((await Following.findOne({
		followerId: me._id,
		followeeId: user._id
	})) != null);

	//#region Construct query
	const sort = { } as any;

	const visibleQuery = me == null ? [{
		visibility: { $in: ['public', 'home'] }
	}] : [{
		visibility: {
			$in: isFollowing ? ['public', 'home', 'followers'] : ['public', 'home']
		}
	}, {
		// myself (for specified/private)
		userId: me._id
	}, {
		// to me (for specified)
		visibleUserIds: { $in: [ me._id ] }
	}];

	const query = {
		$and: [ {} ],
		deletedAt: null,
		userId: user._id,
		$or: visibleQuery
	} as any;

	if (ps.sinceId) {
		sort._id = 1;
		query._id = {
			$gt: ps.sinceId
		};
	} else if (ps.untilId) {
		sort._id = -1;
		query._id = {
			$lt: ps.untilId
		};
	} else if (ps.sinceDate) {
		sort.createdAt = 1;
		query.createdAt = {
			$gt: new Date(ps.sinceDate)
		};
	} else if (ps.untilDate) {
		sort.createdAt = -1;
		query.createdAt = {
			$lt: new Date(ps.untilDate)
		};
	} else {
		sort._id = -1;
	}

	if (!ps.includeReplies) {
		query.replyId = null;
	}

	if (ps.includeMyRenotes === false) {
		query.$and.push({
			$or: [{
				userId: { $ne: user._id }
			}, {
				renoteId: null
			}, {
				text: { $ne: null }
			}, {
				fileIds: { $ne: [] }
			}, {
				poll: { $ne: null }
			}]
		});
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

		if (ps.excludeNsfw) {
			query['_files.metadata.isSensitive'] = {
				$ne: true
			};
		}
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
}));
