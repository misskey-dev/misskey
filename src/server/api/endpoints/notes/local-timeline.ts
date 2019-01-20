import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Note from '../../../../models/note';
import Mute from '../../../../models/mute';
import { packMany } from '../../../../models/note';
import define from '../../define';
import { ILocalUser } from '../../../../models/user';
import { error } from '../../../../prelude/promise';
import fetchMeta from '../../../../misc/fetch-meta';
import activeUsersChart from '../../../../chart/active-users';
import { query } from '../../../../prelude/query';

export const meta = {
	desc: {
		'ja-JP': 'ローカルタイムラインを取得します。'
	},

	params: {
		withFiles: {
			validator: $.bool.optional,
			desc: {
				'ja-JP': 'ファイルが添付された投稿に限定するか否か'
			}
		},

		mediaOnly: {
			validator: $.bool.optional,
			desc: {
				'ja-JP': 'ファイルが添付された投稿に限定するか否か (このパラメータは廃止予定です。代わりに withFiles を使ってください。)'
			}
		},

		fileType: {
			validator: $.arr($.str).optional,
			desc: {
				'ja-JP': '指定された種類のファイルが添付された投稿のみを取得します'
			}
		},

		excludeNsfw: {
			validator: $.bool.optional,
			default: false,
			desc: {
				'ja-JP': 'true にすると、NSFW指定されたファイルを除外します(fileTypeが指定されている場合のみ有効)'
			}
		},

		limit: {
			validator: $.num.optional.range(1, 100),
			default: 10
		},

		sinceId: {
			validator: $.type(ID).optional,
			transform: transform,
		},

		untilId: {
			validator: $.type(ID).optional,
			transform: transform,
		},

		sinceDate: {
			validator: $.num.optional,
		},

		untilDate: {
			validator: $.num.optional,
		},
	}
};

const fetchMutedUserIds = async (muter: ILocalUser) => muter ? await Mute.find({ muterId: muter._id })
	.then(x => x.map(x => x.muteeId)) : null;

export default define(meta, (ps, user) => fetchMeta()
	.then(({ disableLocalTimeline }) =>
		[ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate].filter(x => x).length > 1 ?
			error('only one of sinceId, untilId, sinceDate, untilDate can be specified') :
		disableLocalTimeline && (!user || !user.isAdmin && !user.isModerator) ?
			error('local timeline disabled') :
			fetchMutedUserIds(user))
	.then($nin => Note.find(query({
			_id:
				ps.sinceId ? { $gt: ps.sinceId } :
				ps.untilId ? { $lt: ps.untilId } : undefined,
			createdAt:
				ps.sinceDate ? { $gt: new Date(ps.sinceDate) } :
				ps.untilDate ? { $lt: new Date(ps.untilDate) } : undefined,
			deletedAt: null,
			visibility: 'public',
			'_user.host': null,
			userId: $nin && $nin.length ? { $nin } : undefined,
			'_reply.userId': $nin && $nin.length ? { $nin } : undefined,
			'_renote.userId': $nin && $nin.length ? { $nin } : undefined,
			fileIds: ps.fileType || ps.withFiles !== false || ps.mediaOnly ? { $exists: true, $ne: [] } : undefined,
			'_files.contentType': ps.fileType ? { $in: ps.fileType } : undefined,
			'_files.metadata.isSensitive': ps.fileType && ps.excludeNsfw ? { $ne: true } : undefined,
		}), {
			limit: ps.limit,
			sort: { _id: ps.sinceId || ps.sinceDate ? 1 : -1 }
		}))
	.then(x => packMany(x, user))
	.finally(() => user && activeUsersChart.update(user)));
