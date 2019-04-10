import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import fetchMeta from '../../../../misc/fetch-meta';
import { ApiError } from '../../error';
import { Notes } from '../../../../models';
import { generateMuteQuery } from '../../common/generate-mute-query';
import { makePaginationQuery } from '../../common/make-pagination-query';
import { generateVisibilityQuery } from '../../common/generate-visibility-query';
import { activeUsersChart } from '../../../../services/chart';
import { Brackets } from 'typeorm';

export const meta = {
	desc: {
		'ja-JP': 'オフィシャルタイムラインを取得します。'
	},

	tags: ['notes'],

	params: {
		withFiles: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': 'ファイルが添付された投稿に限定するか否か'
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
		otlDisabled: {
			message: 'Official timeline has been disabled.',
			code: 'OTL_DISABLED',
			id: '32b5ac13-8695-7393-a023-cc2ac1bbbcef'
		},
	}
};

export default define(meta, async (ps, user) => {
	// TODO どっかにキャッシュ
	const m = await fetchMeta();
	if (m.disableOfficialTimeline) {
		if (user == null || (!user.isAdmin && !user.isModerator)) {
			throw new ApiError(meta.errors.otlDisabled);
		}
	}

	//#region Construct query
	const query = makePaginationQuery(Notes.createQueryBuilder('note'),
			ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
		.andWhere('note.visibility = \'public\'')
		.leftJoinAndSelect('note.user', 'user')
		.andWhere('user.isVerified = TRUE');

	if (user) generateVisibilityQuery(query, user);
	if (user) generateMuteQuery(query, user);

	if (ps.withFiles) {
		query.andWhere('note.fileIds != \'{}\'');
	}

	if (ps.fileType) {
		query.andWhere('note.fileIds != \'{}\'');
		query.andWhere(new Brackets(qb => {
			for (const type of ps.fileType) {
				const i = ps.fileType.indexOf(type);
				qb.orWhere(`:type${i} = ANY(note.attachedFileTypes)`, { [`type${i}`]: type });
			}
		}));

		if (ps.excludeNsfw) {
			// v11 TODO
			/*
			query['_files.isSensitive'] = {
				$ne: true
			};
			*/
		}
	}
	//#endregion

	const timeline = await query.take(ps.limit).getMany();

	if (user) {
		activeUsersChart.update(user);
	}

	return await Notes.packMany(timeline, user);
});
