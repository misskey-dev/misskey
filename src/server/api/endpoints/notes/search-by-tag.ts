import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import Note from '../../../../models/note';
import { getFriendIds } from '../../common/get-friends';
import { packMany } from '../../../../models/note';
import define from '../../define';
import { getHideUserIds } from '../../common/get-hide-users';

export const meta = {
	desc: {
		'ja-JP': '指定されたタグが付けられた投稿を取得します。'
	},

	tags: ['notes', 'hashtags'],

	params: {
		tag: {
			validator: $.optional.str,
			desc: {
				'ja-JP': 'タグ'
			}
		},

		query: {
			validator: $.optional.arr($.arr($.str)),
			desc: {
				'ja-JP': 'クエリ'
			}
		},

		following: {
			validator: $.optional.nullable.bool,
			default: null as any
		},

		mute: {
			validator: $.optional.str,
			default: 'mute_all'
		},

		reply: {
			validator: $.optional.nullable.bool,
			default: null as any,
			desc: {
				'ja-JP': '返信に限定するか否か'
			}
		},

		renote: {
			validator: $.optional.nullable.bool,
			default: null as any,
			desc: {
				'ja-JP': 'Renoteに限定するか否か'
			}
		},

		withFiles: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': 'true にすると、ファイルが添付された投稿だけ取得します'
			}
		},

		media: {
			validator: $.optional.nullable.bool,
			default: null as any,
			deprecated: true,
			desc: {
				'ja-JP': 'ファイルが添付された投稿に限定するか否か (このパラメータは廃止予定です。代わりに withFiles を使ってください。)'
			}
		},

		poll: {
			validator: $.optional.nullable.bool,
			default: null as any,
			desc: {
				'ja-JP': 'アンケートが添付された投稿に限定するか否か'
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
		},

		untilDate: {
			validator: $.optional.num,
		},

		offset: {
			validator: $.optional.num.min(0),
			default: 0
		},

		limit: {
			validator: $.optional.num.range(1, 30),
			default: 10
		},
	},

	res: {
		type: 'array',
		items: {
			type: 'Note',
		},
	},
};

export default define(meta, async (ps, me) => {
	const visibleQuery = me == null ? [{
		visibility: { $in: [ 'public', 'home' ] }
	}] : [{
		visibility: { $in: [ 'public', 'home' ] }
	}, {
		// myself (for specified/private)
		userId: me._id
	}, {
		// to me (for specified)
		visibleUserIds: { $in: [ me._id ] }
	}];

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
		deletedAt: { $exists: false },
		$or: visibleQuery
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
		const hideUserIds = await getHideUserIds(me);

		switch (ps.mute) {
			case 'mute_all':
				push({
					userId: {
						$nin: hideUserIds
					},
					'_reply.userId': {
						$nin: hideUserIds
					},
					'_renote.userId': {
						$nin: hideUserIds
					}
				});
				break;
			case 'mute_related':
				push({
					'_reply.userId': {
						$nin: hideUserIds
					},
					'_renote.userId': {
						$nin: hideUserIds
					}
				});
				break;
			case 'mute_direct':
				push({
					userId: {
						$nin: hideUserIds
					}
				});
				break;
			case 'direct_only':
				push({
					userId: {
						$in: hideUserIds
					}
				});
				break;
			case 'related_only':
				push({
					$or: [{
						'_reply.userId': {
							$in: hideUserIds
						}
					}, {
						'_renote.userId': {
							$in: hideUserIds
						}
					}]
				});
				break;
			case 'all_only':
				push({
					$or: [{
						userId: {
							$in: hideUserIds
						}
					}, {
						'_reply.userId': {
							$in: hideUserIds
						}
					}, {
						'_renote.userId': {
							$in: hideUserIds
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
	const notes = await Note.find(q, {
		sort: {
			_id: -1
		},
		limit: ps.limit,
		skip: ps.offset
	});

	return await packMany(notes, me);
});
