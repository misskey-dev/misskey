import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Note from '../../../../models/note';
import Mute from '../../../../models/mute';
import { getFriendIds } from '../../common/get-friends';
import { packMany } from '../../../../models/note';
import define from '../../define';

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

export default define(meta, (ps, me) => new Promise(async (res, rej) => {
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
	res(await packMany(notes, me));
}));
