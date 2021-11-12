import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { maximum } from '@/prelude/array';
import { ApiError } from '../../error';
import { getUser } from '../../common/getters';
import { Not, In, IsNull } from 'typeorm';
import { Notes, Users } from '@/models/index';

export const meta = {
	tags: ['users'],

	requireCredential: false as const,

	params: {
		userId: {
			validator: $.type(ID),
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'User',
		}
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
	const recentNotes = await Notes.find({
		where: {
			userId: user.id,
			replyId: Not(IsNull())
		},
		order: {
			id: -1
		},
		take: 1000,
		select: ['replyId']
	});

	// 投稿が少なかったら中断
	if (recentNotes.length === 0) {
		return [];
	}

	// TODO ミュートを考慮
	const replyTargetNotes = await Notes.find({
		where: {
			id: In(recentNotes.map(p => p.replyId)),
		},
		select: ['userId']
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
	const topRepliedUsers = repliedUsersSorted.slice(0, ps.limit!);

	// Make replies object (includes weights)
	const repliesObj = await Promise.all(topRepliedUsers.map(async (user) => ({
		user: await Users.pack(user, me, { detail: true }),
		weight: repliedUsers[user] / peak
	})));

	return repliesObj;
});
