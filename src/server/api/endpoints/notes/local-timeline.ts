import $ from 'cafy';
import { StringID, NumericalID } from '../../../../misc/cafy-id';
import Note from '../../../../models/entities/note';
import { packMany } from '../../../../models/entities/note';
import define from '../../define';
import fetchMeta from '../../../../misc/fetch-meta';
import activeUsersChart from '../../../../services/chart/charts/active-users';
import { getHideUserIds } from '../../common/get-hide-users';
import { ApiError } from '../../error';

export const meta = {
	desc: {
		'ja-JP': 'ローカルタイムラインを取得します。'
	},

	tags: ['notes'],

	params: {
		withFiles: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': 'ファイルが添付された投稿に限定するか否か'
			}
		},

		mediaOnly: {
			validator: $.optional.bool,
			deprecated: true,
			desc: {
				'ja-JP': 'ファイルが添付された投稿に限定するか否か (このパラメータは廃止予定です。代わりに withFiles を使ってください。)'
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

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		sinceId: {
			validator: $.optional.type(NumericalID),
		},

		untilId: {
			validator: $.optional.type(NumericalID),
		},

		sinceDate: {
			validator: $.optional.num,
		},

		untilDate: {
			validator: $.optional.num,
		},
	},

	res: {
		type: 'array',
		items: {
			type: 'Note',
		},
	},

	errors: {
		ltlDisabled: {
			message: 'Local timeline has been disabled.',
			code: 'LTL_DISABLED',
			id: '45a6eb02-7695-4393-b023-dd3be9aaaefd'
		},
	}
};

export default define(meta, async (ps, user) => {
	const m = await fetchMeta();
	if (m.disableLocalTimeline) {
		if (user == null || (!user.isAdmin && !user.isModerator)) {
			throw new ApiError(meta.errors.ltlDisabled);
		}
	}

	// 隠すユーザーを取得
	const hideUserIds = await getHideUserIds(user);

	//#region Construct query
	const sort = {
		id: -1
	};

	const query = {
		deletedAt: null,

		// public only
		visibility: 'public',

		// リプライでない
		//replyId: null,

		// local
		'_user.host': null
	} as any;

	if (hideUserIds && hideUserIds.length > 0) {
		query.userId = {
			$nin: hideUserIds
		};

		query['_reply.userId'] = {
			$nin: hideUserIds
		};

		query['_renote.userId'] = {
			$nin: hideUserIds
		};
	}

	const withFiles = ps.withFiles != null ? ps.withFiles : ps.mediaOnly;

	if (withFiles) {
		query.fileIds = { $exists: true, $ne: [] };
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

	if (ps.sinceId) {
		sort.id = 1;
		query.id = MoreThan(ps.sinceId);
	} else if (ps.untilId) {
		query.id = LessThan(ps.untilId);
	} else if (ps.sinceDate) {
		sort.id = 1;
		query.createdAt = {
			$gt: new Date(ps.sinceDate)
		};
	} else if (ps.untilDate) {
		query.createdAt = {
			$lt: new Date(ps.untilDate)
		};
	}
	//#endregion

	const timeline = await Note.find(query, {
		take: ps.limit,
		order: sort
	});

	if (user) {
		activeUsersChart.update(user);
	}

	return await packMany(timeline, user);
});
