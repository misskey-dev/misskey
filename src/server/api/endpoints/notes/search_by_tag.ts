import $ from 'cafy'; import ID from '../../../../misc/cafy-id';
import Note from '../../../../models/note';
import User, { ILocalUser } from '../../../../models/user';
import Mute from '../../../../models/mute';
import { getFriendIds } from '../../common/get-friends';
import { pack } from '../../../../models/note';
import getParams from '../../get-params';
import { erase } from '../../../../prelude/array';

export const meta = {
	desc: {
		'ja-JP': '指定されたタグが付けられた投稿を取得します。'
	},

	params: {
		tag: $.str.optional.note({
			desc: {
				'ja-JP': 'タグ'
			}
		}),

		query: $.arr($.arr($.str)).optional.note({
			desc: {
				'ja-JP': 'クエリ'
			}
		}),

		includeUserIds: $.arr($.type(ID)).optional.note({
			default: []
		}),

		excludeUserIds: $.arr($.type(ID)).optional.note({
			default: []
		}),

		includeUserUsernames: $.arr($.str).optional.note({
			default: []
		}),

		excludeUserUsernames: $.arr($.str).optional.note({
			default: []
		}),

		following: $.bool.optional.nullable.note({
			default: null
		}),

		mute: $.str.optional.note({
			default: 'mute_all'
		}),

		reply: $.bool.optional.nullable.note({
			default: null,

			desc: {
				'ja-JP': '返信に限定するか否か'
			}
		}),

		renote: $.bool.optional.nullable.note({
			default: null,

			desc: {
				'ja-JP': 'Renoteに限定するか否か'
			}
		}),

		withFiles: $.bool.optional.note({
			desc: {
				'ja-JP': 'true にすると、ファイルが添付された投稿だけ取得します'
			}
		}),

		media: $.bool.optional.nullable.note({
			default: null,

			desc: {
				'ja-JP': 'ファイルが添付された投稿に限定するか否か (このパラメータは廃止予定です。代わりに withFiles を使ってください。)'
			}
		}),

		poll: $.bool.optional.nullable.note({
			default: null,

			desc: {
				'ja-JP': 'アンケートが添付された投稿に限定するか否か'
			}
		}),

		untilId: $.type(ID).optional.note({
			desc: {
				'ja-JP': '指定すると、この投稿を基点としてより古い投稿を取得します'
			}
		}),

		sinceDate: $.num.optional.note({
		}),

		untilDate: $.num.optional.note({
		}),

		offset: $.num.optional.min(0).note({
			default: 0
		}),

		limit: $.num.optional.range(1, 30).note({
			default: 10
		}),
	}
};

export default (params: any, me: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) throw psErr;

	if (ps.includeUserUsernames != null) {
		const ids = erase(null, await Promise.all(ps.includeUserUsernames.map(async (username) => {
			const _user = await User.findOne({
				usernameLower: username.toLowerCase()
			});
			return _user ? _user._id : null;
		})));

		ids.forEach(id => ps.includeUserIds.push(id));
	}

	if (ps.excludeUserUsernames != null) {
		const ids = erase(null, await Promise.all(ps.excludeUserUsernames.map(async (username) => {
			const _user = await User.findOne({
				usernameLower: username.toLowerCase()
			});
			return _user ? _user._id : null;
		})));

		ids.forEach(id => ps.excludeUserIds.push(id));
	}

	const q: any = {
		$and: [ps.tag ? {
			tagsLower: ps.tag.toLowerCase()
		} : {
			$or: ps.query.map(tags => ({
				$and: tags.map(t => ({
					tagsLower: t.toLowerCase()
				}))
			}))
		}],
		deletedAt: { $exists: false }
	};

	const push = (x: any) => q.$and.push(x);

	if (ps.includeUserIds && ps.includeUserIds.length != 0) {
		push({
			userId: {
				$in: ps.includeUserIds
			}
		});
	} else if (ps.excludeUserIds && ps.excludeUserIds.length != 0) {
		push({
			userId: {
				$nin: ps.excludeUserIds
			}
		});
	}

	if (ps.following != null && me != null) {
		const ids = await getFriendIds(me._id, false);
		push({
			userId: ps.following ? {
				$in: ids
			} : {
				$nin: ids.concat(me._id)
			}
		});
	}

	if (me != null) {
		const mutes = await Mute.find({
			muterId: me._id,
			deletedAt: { $exists: false }
		});
		const mutedUserIds = mutes.map(m => m.muteeId);

		switch (ps.mute) {
			case 'mute_all':
				push({
					userId: {
						$nin: mutedUserIds
					},
					'_reply.userId': {
						$nin: mutedUserIds
					},
					'_renote.userId': {
						$nin: mutedUserIds
					}
				});
				break;
			case 'mute_related':
				push({
					'_reply.userId': {
						$nin: mutedUserIds
					},
					'_renote.userId': {
						$nin: mutedUserIds
					}
				});
				break;
			case 'mute_direct':
				push({
					userId: {
						$nin: mutedUserIds
					}
				});
				break;
			case 'direct_only':
				push({
					userId: {
						$in: mutedUserIds
					}
				});
				break;
			case 'related_only':
				push({
					$or: [{
						'_reply.userId': {
							$in: mutedUserIds
						}
					}, {
						'_renote.userId': {
							$in: mutedUserIds
						}
					}]
				});
				break;
			case 'all_only':
				push({
					$or: [{
						userId: {
							$in: mutedUserIds
						}
					}, {
						'_reply.userId': {
							$in: mutedUserIds
						}
					}, {
						'_renote.userId': {
							$in: mutedUserIds
						}
					}]
				});
				break;
		}
	}

	if (ps.reply != null) {
		if (ps.reply) {
			push({
				replyId: {
					$exists: true,
					$ne: null
				}
			});
		} else {
			push({
				$or: [{
					replyId: {
						$exists: false
					}
				}, {
					replyId: null
				}]
			});
		}
	}

	if (ps.renote != null) {
		if (ps.renote) {
			push({
				renoteId: {
					$exists: true,
					$ne: null
				}
			});
		} else {
			push({
				$or: [{
					renoteId: {
						$exists: false
					}
				}, {
					renoteId: null
				}]
			});
		}
	}

	const withFiles = ps.withFiles != null ? ps.withFiles : ps.media;

	if (withFiles) {
		push({
			fileIds: { $exists: true, $ne: [] }
		});
	}

	if (ps.poll != null) {
		if (ps.poll) {
			push({
				poll: {
					$exists: true,
					$ne: null
				}
			});
		} else {
			push({
				$or: [{
					poll: {
						$exists: false
					}
				}, {
					poll: null
				}]
			});
		}
	}

	if (ps.untilId) {
		push({
			_id: {
				$lt: ps.untilId
			}
		});
	}

	if (ps.sinceDate) {
		push({
			createdAt: {
				$gt: new Date(ps.sinceDate)
			}
		});
	}

	if (ps.untilDate) {
		push({
			createdAt: {
				$lt: new Date(ps.untilDate)
			}
		});
	}

	if (q.$and.length == 0) {
		delete q.$and;
	}

	// Search notes
	const notes = await Note
		.find(q, {
			sort: {
				_id: -1
			},
			limit: ps.limit,
			skip: ps.offset
		});

	// Serialize
	res(await Promise.all(notes.map(note => pack(note, me))));
});
