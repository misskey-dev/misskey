/**
 * Module dependencies
 */
import $ from 'cafy';
const escapeRegexp = require('escape-regexp');
import Post from '../../models/post';
import User from '../../models/user';
import Mute from '../../models/mute';
import getFriends from '../../common/get-friends';
import { pack } from '../../models/post';

/**
 * Search a post
 *
 * @param {any} params
 * @param {any} me
 * @return {Promise<any>}
 */
module.exports = (params, me) => new Promise(async (res, rej) => {
	// Get 'text' parameter
	const [text, textError] = $(params.text).optional.string().$;
	if (textError) return rej('invalid text param');

	// Get 'include_user_ids' parameter
	const [includeUserIds = [], includeUserIdsErr] = $(params.include_user_ids).optional.array('id').$;
	if (includeUserIdsErr) return rej('invalid include_user_ids param');

	// Get 'exclude_user_ids' parameter
	const [excludeUserIds = [], excludeUserIdsErr] = $(params.exclude_user_ids).optional.array('id').$;
	if (excludeUserIdsErr) return rej('invalid exclude_user_ids param');

	// Get 'include_user_usernames' parameter
	const [includeUserUsernames = [], includeUserUsernamesErr] = $(params.include_user_usernames).optional.array('string').$;
	if (includeUserUsernamesErr) return rej('invalid include_user_usernames param');

	// Get 'exclude_user_usernames' parameter
	const [excludeUserUsernames = [], excludeUserUsernamesErr] = $(params.exclude_user_usernames).optional.array('string').$;
	if (excludeUserUsernamesErr) return rej('invalid exclude_user_usernames param');

	// Get 'following' parameter
	const [following = null, followingErr] = $(params.following).optional.nullable.boolean().$;
	if (followingErr) return rej('invalid following param');

	// Get 'mute' parameter
	const [mute = 'mute_all', muteErr] = $(params.mute).optional.string().$;
	if (muteErr) return rej('invalid mute param');

	// Get 'reply' parameter
	const [reply = null, replyErr] = $(params.reply).optional.nullable.boolean().$;
	if (replyErr) return rej('invalid reply param');

	// Get 'repost' parameter
	const [repost = null, repostErr] = $(params.repost).optional.nullable.boolean().$;
	if (repostErr) return rej('invalid repost param');

	// Get 'media' parameter
	const [media = null, mediaErr] = $(params.media).optional.nullable.boolean().$;
	if (mediaErr) return rej('invalid media param');

	// Get 'poll' parameter
	const [poll = null, pollErr] = $(params.poll).optional.nullable.boolean().$;
	if (pollErr) return rej('invalid poll param');

	// Get 'since_date' parameter
	const [sinceDate, sinceDateErr] = $(params.since_date).optional.number().$;
	if (sinceDateErr) throw 'invalid since_date param';

	// Get 'until_date' parameter
	const [untilDate, untilDateErr] = $(params.until_date).optional.number().$;
	if (untilDateErr) throw 'invalid until_date param';

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
				username_lower: username.toLowerCase()
			});
			return _user ? _user._id : null;
		}))).filter(id => id != null);
		includeUsers = includeUsers.concat(ids);
	}

	let excludeUsers = excludeUserIds;
	if (excludeUserUsernames != null) {
		const ids = (await Promise.all(excludeUserUsernames.map(async (username) => {
			const _user = await User.findOne({
				username_lower: username.toLowerCase()
			});
			return _user ? _user._id : null;
		}))).filter(id => id != null);
		excludeUsers = excludeUsers.concat(ids);
	}

	search(res, rej, me, text, includeUsers, excludeUsers, following,
			mute, reply, repost, media, poll, sinceDate, untilDate, offset, limit);
});

async function search(
	res, rej, me, text, includeUserIds, excludeUserIds, following,
	mute, reply, repost, media, poll, sinceDate, untilDate, offset, max) {

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
			user_id: {
				$in: includeUserIds
			}
		});
	} else if (excludeUserIds && excludeUserIds.length != 0) {
		push({
			user_id: {
				$nin: excludeUserIds
			}
		});
	}

	if (following != null && me != null) {
		const ids = await getFriends(me._id, false);
		push({
			user_id: following ? {
				$in: ids
			} : {
				$nin: ids.concat(me._id)
			}
		});
	}

	if (me != null) {
		const mutes = await Mute.find({
			muter_id: me._id,
			deleted_at: { $exists: false }
		});
		const mutedUserIds = mutes.map(m => m.mutee_id);

		switch (mute) {
			case 'mute_all':
				push({
					user_id: {
						$nin: mutedUserIds
					},
					'_reply.user_id': {
						$nin: mutedUserIds
					},
					'_repost.user_id': {
						$nin: mutedUserIds
					}
				});
				break;
			case 'mute_related':
				push({
					'_reply.user_id': {
						$nin: mutedUserIds
					},
					'_repost.user_id': {
						$nin: mutedUserIds
					}
				});
				break;
			case 'mute_direct':
				push({
					user_id: {
						$nin: mutedUserIds
					}
				});
				break;
			case 'direct_only':
				push({
					user_id: {
						$in: mutedUserIds
					}
				});
				break;
			case 'related_only':
				push({
					$or: [{
						'_reply.user_id': {
							$in: mutedUserIds
						}
					}, {
						'_repost.user_id': {
							$in: mutedUserIds
						}
					}]
				});
				break;
			case 'all_only':
				push({
					$or: [{
						user_id: {
							$in: mutedUserIds
						}
					}, {
						'_reply.user_id': {
							$in: mutedUserIds
						}
					}, {
						'_repost.user_id': {
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
				reply_id: {
					$exists: true,
					$ne: null
				}
			});
		} else {
			push({
				$or: [{
					reply_id: {
						$exists: false
					}
				}, {
					reply_id: null
				}]
			});
		}
	}

	if (repost != null) {
		if (repost) {
			push({
				repost_id: {
					$exists: true,
					$ne: null
				}
			});
		} else {
			push({
				$or: [{
					repost_id: {
						$exists: false
					}
				}, {
					repost_id: null
				}]
			});
		}
	}

	if (media != null) {
		if (media) {
			push({
				media_ids: {
					$exists: true,
					$ne: null
				}
			});
		} else {
			push({
				$or: [{
					media_ids: {
						$exists: false
					}
				}, {
					media_ids: null
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
			created_at: {
				$gt: new Date(sinceDate)
			}
		});
	}

	if (untilDate) {
		push({
			created_at: {
				$lt: new Date(untilDate)
			}
		});
	}

	if (q.$and.length == 0) {
		q = {};
	}

	// Search posts
	const posts = await Post
		.find(q, {
			sort: {
				_id: -1
			},
			limit: max,
			skip: offset
		});

	// Serialize
	res(await Promise.all(posts.map(async post =>
		await pack(post, me))));
}
