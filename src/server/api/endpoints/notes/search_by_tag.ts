import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Note from '../../../../models/note';
import Mute from '../../../../models/mute';
import { getFriendIds } from '../../common/get-friends';
import { packMany } from '../../../../models/note';
import define from '../../define';
import { ObjectID } from 'mongodb';

export const meta = {
	desc: {
		'ja-JP': '指定されたタグが付けられた投稿を取得します。'
	},

	params: {
		tag: {
			validator: $.str.optional,
			desc: {
				'ja-JP': 'タグ'
			}
		},

		query: {
			validator: $.arr($.arr($.str)).optional,
			desc: {
				'ja-JP': 'クエリ'
			}
		},

		following: {
			validator: $.bool.optional.nullable,
			default: null as any
		},

		mute: {
			validator: $.str.optional,
			default: 'mute_all'
		},

		reply: {
			validator: $.bool.optional.nullable,
			default: null as any,
			desc: {
				'ja-JP': '返信に限定するか否か'
			}
		},

		renote: {
			validator: $.bool.optional.nullable,
			default: null as any,
			desc: {
				'ja-JP': 'Renoteに限定するか否か'
			}
		},

		withFiles: {
			validator: $.bool.optional,
			desc: {
				'ja-JP': 'true にすると、ファイルが添付された投稿だけ取得します'
			}
		},

		media: {
			validator: $.bool.optional.nullable,
			default: null as any,
			desc: {
				'ja-JP': 'ファイルが添付された投稿に限定するか否か (このパラメータは廃止予定です。代わりに withFiles を使ってください。)'
			}
		},

		poll: {
			validator: $.bool.optional.nullable,
			default: null as any,
			desc: {
				'ja-JP': 'アンケートが添付された投稿に限定するか否か'
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
		},

		untilDate: {
			validator: $.num.optional,
		},

		offset: {
			validator: $.num.optional.min(0),
			default: 0
		},

		limit: {
			validator: $.num.optional.range(1, 30),
			default: 10
		},
	}
};

const mika: { [x: string]: (x: ObjectID[]) => any } = {
	'mute_all': $nin => ({
		userId: { $nin },
		'_reply.userId': { $nin },
		'_renote.userId': { $nin }
	}),
	'mute_related': $nin => ({
		'_reply.userId': { $nin },
		'_renote.userId': { $nin }
	}),
	'mute_direct': $nin => ({
		userId: { $nin }
	}),
	'direct_only': $in => ({
		userId: { $in }
	}),
	'related_only': $in => ({
		$or: [{
			'_reply.userId': { $in }
		}, {
			'_renote.userId': { $in }
		}]
	}),
	'all_only': $in => ({
		$or: [{
			userId: { $in }
		}, {
			'_reply.userId': { $in }
		}, {
			'_renote.userId': { $in }
		}]
	})
};

const query = (source: {
	$and: any[],
	deletedAt: any,
	$or: any[]
}) => {
	if (!source.$and.length) delete source.$and;
	return source;
};

export default define(meta, (ps, me) => Promise.resolve()
	.then(async () => query({
		$and: [
			ps.tag ?
				{ tagsLower: ps.tag.toLowerCase() } :
				{ $or: ps.query.map(tags => ({ $and: tags.map(t => ({ tagsLower: t.toLowerCase() })) })) },
			...(ps.following && me ? [await getFriendIds(me._id, false)
				.then($in => ({ userId: ps.following ? { $in } : { $nin: $in.concat(me._id) } }))] : []),
			...(me && mika[ps.mute] ? [await Mute.find({
					muterId: me._id,
					deletedAt: { $exists: false }
				})
				.then(x => mika[ps.mute](x.map(x => x.muteeId)))] : []),
			...(ps.reply ? [{
					replyId: {
						$exists: true,
						$ne: null
					}
				}] : ps.reply === false ? [{
					$or: [{
						replyId: { $exists: false }
					}, { replyId: null }]
				}] : []),
			...(ps.renote ? [{
				renoteId: {
					$exists: true,
					$ne: null
				}
			}] : ps.renote === false ? [{
				$or: [{
					renoteId: { $exists: false }
				}, { renoteId: null }]
			}] : []),
			...(ps.withFiles || ps.media ? [
				{ fileIds: { $exists: true, $ne: [] } }
			] : []),
			...(ps.poll ? [{
				poll: {
					$exists: true,
					$ne: null
				}
			}] : ps.poll === false ? [{
				$or: [{
					poll: {
						$exists: false
					}
				}, {
					poll: null
				}]
			}] : []),
			...(ps.untilId ? [{
				_id: { $lt: ps.untilId 	}
			}] : []),
			...(ps.sinceDate ? [{
				createdAt: { $gt: new Date(ps.sinceDate) }
			}] : []),
			...(ps.untilDate ? [{
				createdAt: { $lt: new Date(ps.untilDate) }
			}] : [])
		],
		deletedAt: { $exists: false },
		$or: [{
			visibility: { $in: ['public', 'home'] }
		},
		...(!me ? [{ userId: me._id }, {
			visibleUserIds: { $in: [ me._id ] }
		}] : [])]
	}))
	.then(x => Note.find(x, {
			sort: { _id: -1 },
			limit: ps.limit,
			skip: ps.offset
		}))
	.then(x => packMany(x, me)));
