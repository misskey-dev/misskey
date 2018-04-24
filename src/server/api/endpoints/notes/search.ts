/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../cafy-id';
const escapeRegexp = require('escape-regexp');
import Note from '../../../../models/note';
import User from '../../../../models/user';
import Mute from '../../../../models/mute';
import { getFriendIds } from '../../common/get-friends';
import { pack } from '../../../../models/note';

/**
 * Search a note
 *
 * @param {any} params
 * @param {any} me
 * @return {Promise<any>}
 */
module.exports = (params, me) => new Promise(async (res, rej) => {
	// Get 'text' parameter
	const [text, textError] = $(params.text).optional.string().$;
	if (textError) return rej('invalid text param');

	// Get 'includeUserIds' parameter
	const [includeUserIds = [], includeUserIdsErr] = $(params.includeUserIds).optional.array($().type(ID)).$;
	if (includeUserIdsErr) return rej('invalid includeUserIds param');

	// Get 'excludeUserIds' parameter
	const [excludeUserIds = [], excludeUserIdsErr] = $(params.excludeUserIds).optional.array($().type(ID)).$;
	if (excludeUserIdsErr) return rej('invalid excludeUserIds param');

	// Get 'includeUserUsernames' parameter
	const [includeUserUsernames = [], includeUserUsernamesErr] = $(params.includeUserUsernames).optional.array($().string()).$;
	if (includeUserUsernamesErr) return rej('invalid includeUserUsernames param');

	// Get 'excludeUserUsernames' parameter
	const [excludeUserUsernames = [], excludeUserUsernamesErr] = $(params.excludeUserUsernames).optional.array($().string()).$;
	if (excludeUserUsernamesErr) return rej('invalid excludeUserUsernames param');

	// Get 'following' parameter
	const [following = null, followingErr] = $(params.following).optional.nullable.boolean().$;
	if (followingErr) return rej('invalid following param');

	// Get 'mute' parameter
	const [mute = 'mute_all', muteErr] = $(params.mute).optional.string().$;
	if (muteErr) return rej('invalid mute param');

	// Get 'reply' parameter
	const [reply = null, replyErr] = $(params.reply).optional.nullable.boolean().$;
	if (replyErr) return rej('invalid reply param');

	// Get 'renote' parameter
	const [renote = null, renoteErr] = $(params.renote).optional.nullable.boolean().$;
	if (renoteErr) return rej('invalid renote param');

	// Get 'media' parameter
	const [media = null, mediaErr] = $(params.media).optional.nullable.boolean().$;
	if (mediaErr) return rej('invalid media param');

	// Get 'poll' parameter
	const [poll = null, pollErr] = $(params.poll).optional.nullable.boolean().$;
	if (pollErr) return rej('invalid poll param');

	// Get 'sinceDate' parameter
	const [sinceDate, sinceDateErr] = $(params.sinceDate).optional.number().$;
	if (sinceDateErr) throw 'invalid sinceDate param';

	// Get 'untilDate' parameter
	const [untilDate, untilDateErr] = $(params.untilDate).optional.number().$;
	if (untilDateErr) throw 'invalid untilDate param';

	// Get 'offset' parameter
	const [offset = 0, offsetErr] = $(params.offset).optional.number().min(0).$;
	if (offsetErr) return rej('invalid offset param');

	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 30).$;
	if (limitErr) return rej('invalid limit param');

	let includeUsers = includeUserIds;
	if (includeUserUsernames != null) {
		const ids = (await Promise.all(includeUserUsernames.map(async (username) => {
			const _user = await User.findOne({
				usernameLower: username.toLowerCase()
			});
			return _user ? _user._id : null;
		}))).filter(id => id != null);
		includeUsers = includeUsers.concat(ids);
	}

	let excludeUsers = excludeUserIds;
	if (excludeUserUsernames != null) {
		const ids = (await Promise.all(excludeUserUsernames.map(async (username) => {
			const _user = await User.findOne({
				usernameLower: username.toLowerCase()
			});
			return _user ? _user._id : null;
		}))).filter(id => id != null);
		excludeUsers = excludeUsers.concat(ids);
	}

	search(res, rej, me, text, includeUsers, excludeUsers, following,
			mute, reply, renote, media, poll, sinceDate, untilDate, offset, limit);
});

async function search(
	res, rej, me, text, includeUserIds, excludeUserIds, following,
	mute, reply, renote, media, poll, sinceDate, untilDate, offset, max) {

	let q: any = {
		$and: []
	};

	const push = x => q.$and.push(x);

	if (text) {
		// 完全一致検索
		if (/"""(.+?)"""/.test(text)) {
			const x = text.match(/"""(.+?)"""/)[1];
			push({
				text: x
			});
		} else {
			const tags = text.split(' ').filter(x => x[0] == '#');
			if (tags) {
				push({
					$and: tags.map(x => ({
						tags: x
					}))
				});
			}

			push({
				$and: text.split(' ').map(x => ({
					// キーワードが-で始まる場合そのキーワードを除外する
					text: x[0] == '-' ? {
						$not: new RegExp(escapeRegexp(x.substr(1)))
					} : new RegExp(escapeRegexp(x))
				}))
			});
		}
	}

	if (includeUserIds && includeUserIds.length != 0) {
		push({
			userId: {
				$in: includeUserIds
			}
		});
	} else if (excludeUserIds && excludeUserIds.length != 0) {
		push({
			userId: {
				$nin: excludeUserIds
			}
		});
	}

	if (following != null && me != null) {
		const ids = await getFriendIds(me._id, false);
		push({
			userId: following ? {
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

		switch (mute) {
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

	if (reply != null) {
		if (reply) {
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

	if (renote != null) {
		if (renote) {
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

	if (media != null) {
		if (media) {
			push({
				mediaIds: {
					$exists: true,
					$ne: null
				}
			});
		} else {
			push({
				$or: [{
					mediaIds: {
						$exists: false
					}
				}, {
					mediaIds: null
				}]
			});
		}
	}

	if (poll != null) {
		if (poll) {
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

	if (sinceDate) {
		push({
			createdAt: {
				$gt: new Date(sinceDate)
			}
		});
	}

	if (untilDate) {
		push({
			createdAt: {
				$lt: new Date(untilDate)
			}
		});
	}

	if (q.$and.length == 0) {
		q = {};
	}

	// Search notes
	const notes = await Note
		.find(q, {
			sort: {
				_id: -1
			},
			limit: max,
			skip: offset
		});

	// Serialize
	res(await Promise.all(notes.map(async note =>
		await pack(note, me))));
}
