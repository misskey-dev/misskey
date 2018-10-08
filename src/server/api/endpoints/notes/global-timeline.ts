import $ from 'cafy'; import ID from '../../../../misc/cafy-id';
import Note from '../../../../models/note';
import Mute from '../../../../models/mute';
import { packMany } from '../../../../models/note';
import { ILocalUser } from '../../../../models/user';
import getParams from '../../get-params';
import { countIf } from '../../../../prelude/array';

export const meta = {
	desc: {
		'ja-JP': 'グローバルタイムラインを取得します。'
	},

	params: {
		withFiles: $.bool.optional.note({
			desc: {
				'ja-JP': 'ファイルが添付された投稿に限定するか否か'
			}
		}),

		mediaOnly: $.bool.optional.note({
			desc: {
				'ja-JP': 'ファイルが添付された投稿に限定するか否か (このパラメータは廃止予定です。代わりに withFiles を使ってください。)'
			}
		}),

		limit: $.num.optional.range(1, 100).note({
			default: 10
		}),

		sinceId: $.type(ID).optional.note({}),

		untilId: $.type(ID).optional.note({}),

		sinceDate: $.num.optional.note({}),

		untilDate: $.num.optional.note({}),
	}
};

export default async (params: any, user: ILocalUser) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) throw psErr;

	// Check if only one of sinceId, untilId, sinceDate, untilDate specified
	if (countIf(x => x != null, [ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate]) > 1) {
		throw 'only one of sinceId, untilId, sinceDate, untilDate can be specified';
	}

	// ミュートしているユーザーを取得
	const mutedUserIds = user ? (await Mute.find({
		muterId: user._id
	})).map(m => m.muteeId) : null;

	//#region Construct query
	const sort = {
		_id: -1
	};

	const query = {
		// public only
		visibility: 'public',

		replyId: null
	} as any;

	if (mutedUserIds && mutedUserIds.length > 0) {
		query.userId = {
			$nin: mutedUserIds
		};

		query['_reply.userId'] = {
			$nin: mutedUserIds
		};

		query['_renote.userId'] = {
			$nin: mutedUserIds
		};
	}

	const withFiles = ps.withFiles != null ? ps.withFiles : ps.mediaOnly;

	if (withFiles) {
		query.fileIds = { $exists: true, $ne: [] };
	}

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
	//#endregion

	// Issue query
	const timeline = await Note
		.find(query, {
			limit: ps.limit,
			sort: sort
		});

	// Serialize
	return await packMany(timeline, user);
};
