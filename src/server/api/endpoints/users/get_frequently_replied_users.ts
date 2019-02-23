import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import Note from '../../../../models/note';
import { pack } from '../../../../models/user';
import define from '../../define';
import { maximum } from '../../../../prelude/array';
import { getHideUserIds } from '../../common/get-hide-users';
import { ApiError } from '../../error';
import { getUser } from '../../common/getters';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	params: {
		userId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のユーザーのID',
				'en-US': 'Target user ID'
			}
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},
	},

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'e6965129-7b2a-40a4-bae2-cd84cd434822'
		}
	}
};

export default define(meta, async (ps, me) => {
	// Lookup user
	const user = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
		throw e;
	});

	// Fetch recent notes
	const recentNotes = await Note.find({
		userId: user._id,
		replyId: {
			$exists: true,
			$ne: null
		}
	}, {
		sort: {
			_id: -1
		},
		limit: 1000,
		fields: {
			_id: false,
			replyId: true
		}
	});

	// 投稿が少なかったら中断
	if (recentNotes.length === 0) {
		return [];
	}

	const hideUserIds = await getHideUserIds(me);
	hideUserIds.push(user._id);

	const replyTargetNotes = await Note.find({
		_id: {
			$in: recentNotes.map(p => p.replyId)
		},
		userId: {
			$nin: hideUserIds
		}
	}, {
		fields: {
			_id: false,
			userId: true
		}
	});

	const repliedUsers: any = {};

	// Extract replies from recent notes
	for (const userId of replyTargetNotes.map(x => x.userId.toString())) {
		if (repliedUsers[userId]) {
			repliedUsers[userId]++;
		} else {
			repliedUsers[userId] = 1;
		}
	}

	// Calc peak
	const peak = maximum(Object.values(repliedUsers));

	// Sort replies by frequency
	const repliedUsersSorted = Object.keys(repliedUsers).sort((a, b) => repliedUsers[b] - repliedUsers[a]);

	// Extract top replied users
	const topRepliedUsers = repliedUsersSorted.slice(0, ps.limit);

	// Make replies object (includes weights)
	const repliesObj = await Promise.all(topRepliedUsers.map(async (user) => ({
		user: await pack(user, me, { detail: true }),
		weight: repliedUsers[user] / peak
	})));

	return repliesObj;
});
