import $ from 'cafy';
import { StringID, NumericalID } from '../../../../misc/cafy-id';
import Note, { packMany } from '../../../../models/entities/note';
import define from '../../define';
import Following from '../../../../models/entities/following';
import { ApiError } from '../../error';
import { getUser } from '../../common/getters';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーのタイムラインを取得します。'
	},

	tags: ['users', 'notes'],

	params: {
		userId: {
			validator: $.type(StringID),
			desc: {
				'ja-JP': '対象のユーザーのID',
				'en-US': 'Target user ID'
			}
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
			validator: $.optional.type(NumericalID),,
				'ja-JP': '指定すると、この投稿を基点としてより新しい投稿を取得します'
			}
		},

		untilId: {
			validator: $.optional.type(NumericalID),,
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
			deprecated: true,
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
	},

	res: {
		type: 'array',
		items: {
			type: 'Note',
		},
	},

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '27e494ba-2ac2-48e8-893b-10d4d8c2387b'
		}
	}
};

export default define(meta, async (ps, me) => {
	// Lookup user
	const user = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
		throw e;
	});

	const isFollowing = me == null ? false : ((await Following.findOne({
		followerId: me.id,
		followeeId: user.id
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
		userId: me.id
	}, {
		// to me (for specified)
		visibleUserIds: { $in: [ me.id ] }
	}];

	const query = {
		$and: [ {} ],
		deletedAt: null,
		userId: user.id,
		$or: visibleQuery
	} as any;

	if (ps.sinceId) {
		sort.id = 1;
		query.id = MoreThan(ps.sinceId);
	} else if (ps.untilId) {
		sort.id = -1;
		query.id = LessThan(ps.untilId);
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
		sort.id = -1;
	}

	if (!ps.includeReplies) {
		query.replyId = null;
	}

	if (ps.includeMyRenotes === false) {
		query.$and.push({
			$or: [{
				userId: { $ne: user.id }
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

	const notes = await Note.find(query, {
		take: ps.limit,
		sort: sort
	});

	return await packMany(notes, me);
});
