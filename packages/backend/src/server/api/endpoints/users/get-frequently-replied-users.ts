import define from '../../define.js';
import { maximum } from '@/prelude/array.js';
import { ApiError } from '../../error.js';
import { getUser } from '../../common/getters.js';
import { Not, In, IsNull } from 'typeorm';
import { Notes, Users } from '@/models/index.js';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	description: 'Get a list of other users that the specified user frequently replies to.',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				user: {
					type: 'object',
					optional: false, nullable: false,
					ref: 'UserDetailed',
				},
				weight: {
					type: 'number',
					optional: false, nullable: false,
				},
			},
		},
	},

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'e6965129-7b2a-40a4-bae2-cd84cd434822',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
	},
	required: ['userId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	// Lookup user
	const user = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
		throw e;
	});

	// Fetch recent notes
	const recentNotes = await Notes.find({
		where: {
			userId: user.id,
			replyId: Not(IsNull()),
		},
		order: {
			id: -1,
		},
		take: 1000,
		select: ['replyId'],
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
		select: ['userId'],
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
		user: await Users.pack(user, me, { detail: true }),
		weight: repliedUsers[user] / peak,
	})));

	return repliesObj;
});
