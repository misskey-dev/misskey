import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import Note from '../../../../models/entities/note';
import { packMany } from '../../../../models/entities/note';
import define from '../../define';
import fetchMeta from '../../../../misc/fetch-meta';
import activeUsersChart from '../../../../services/chart/charts/active-users';
import { getHideUserIds } from '../../common/get-hide-users';
import { ApiError } from '../../error';
import { Notes } from '../../../../models';
import { generateMuteQuery } from '../../common/generate-mute-query';

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
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
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

	//#region Construct query
	const sort = {
		id: -1
	};

	const query = Notes.createQueryBuilder('note')
		.where('visibility = \'public\'')
		.andWhere('userHost = NULL');

	if (user) query.andWhere(generateMuteQuery(user));

	const withFiles = ps.withFiles != null ? ps.withFiles : ps.mediaOnly;

	if (withFiles) {
		query.andWhere('note.fileIds != []');
	}

	if (ps.fileType) {
		query.andWhere('note.fileIds != []');
		query.andWhere('note.attachedFileTypes ANY(:type)', { type: ps.fileType });

		if (ps.excludeNsfw) {
			// v11 TODO
			query['_files.isSensitive'] = {
				$ne: true
			};
		}
	}

	if (ps.sinceId) {
		sort.id = 1;
		query.andWhere('note.id > :sinceId', { sinceId: ps.sinceId });
	} else if (ps.untilId) {
		query.andWhere('note.id < :untilId', { untilId: ps.untilId });
	} else if (ps.sinceDate) {
		sort.id = 1;
		query.andWhere('note.createdAt > :sinceDate', { sinceDate: new Date(ps.sinceDate) });
	} else if (ps.untilDate) {
		query.andWhere('note.createdAt < :untilDate', { untilDate: new Date(ps.untilDate) });
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
