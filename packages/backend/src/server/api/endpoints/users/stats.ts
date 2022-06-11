import define from '../../define.js';
import { ApiError } from '../../error.js';
import { DriveFiles, Followings, NoteFavorites, NoteReactions, Notes, PageLikes, PollVotes, Users } from '@/models/index.js';
import { awaitAll } from '@/prelude/await-all.js';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	description: 'Show statistics about a user.',

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '9e638e45-3b25-4ef7-8f95-07e8498f1819',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			notesCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			repliesCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			renotesCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			repliedCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			renotedCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			pollVotesCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			pollVotedCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			localFollowingCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			remoteFollowingCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			localFollowersCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			remoteFollowersCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			followingCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			followersCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			sentReactionsCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			receivedReactionsCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			noteFavoritesCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			pageLikesCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			pageLikedCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			driveFilesCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			driveUsage: {
				type: 'integer',
				optional: false, nullable: false,
				description: 'Drive usage in bytes',
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const user = await Users.findOneBy({ id: ps.userId });
	if (user == null) {
		throw new ApiError(meta.errors.noSuchUser);
	}

	const result = await awaitAll({
		notesCount: Notes.createQueryBuilder('note')
			.where('note.userId = :userId', { userId: user.id })
			.getCount(),
		repliesCount: Notes.createQueryBuilder('note')
			.where('note.userId = :userId', { userId: user.id })
			.andWhere('note.replyId IS NOT NULL')
			.getCount(),
		renotesCount: Notes.createQueryBuilder('note')
			.where('note.userId = :userId', { userId: user.id })
			.andWhere('note.renoteId IS NOT NULL')
			.getCount(),
		repliedCount: Notes.createQueryBuilder('note')
			.where('note.replyUserId = :userId', { userId: user.id })
			.getCount(),
		renotedCount: Notes.createQueryBuilder('note')
			.where('note.renoteUserId = :userId', { userId: user.id })
			.getCount(),
		pollVotesCount: PollVotes.createQueryBuilder('vote')
			.where('vote.userId = :userId', { userId: user.id })
			.getCount(),
		pollVotedCount: PollVotes.createQueryBuilder('vote')
			.innerJoin('vote.note', 'note')
			.where('note.userId = :userId', { userId: user.id })
			.getCount(),
		localFollowingCount: Followings.createQueryBuilder('following')
			.where('following.followerId = :userId', { userId: user.id })
			.andWhere('following.followeeHost IS NULL')
			.getCount(),
		remoteFollowingCount: Followings.createQueryBuilder('following')
			.where('following.followerId = :userId', { userId: user.id })
			.andWhere('following.followeeHost IS NOT NULL')
			.getCount(),
		localFollowersCount: Followings.createQueryBuilder('following')
			.where('following.followeeId = :userId', { userId: user.id })
			.andWhere('following.followerHost IS NULL')
			.getCount(),
		remoteFollowersCount: Followings.createQueryBuilder('following')
			.where('following.followeeId = :userId', { userId: user.id })
			.andWhere('following.followerHost IS NOT NULL')
			.getCount(),
		sentReactionsCount: NoteReactions.createQueryBuilder('reaction')
			.where('reaction.userId = :userId', { userId: user.id })
			.getCount(),
		receivedReactionsCount: NoteReactions.createQueryBuilder('reaction')
			.innerJoin('reaction.note', 'note')
			.where('note.userId = :userId', { userId: user.id })
			.getCount(),
		noteFavoritesCount: NoteFavorites.createQueryBuilder('favorite')
			.where('favorite.userId = :userId', { userId: user.id })
			.getCount(),
		pageLikesCount: PageLikes.createQueryBuilder('like')
			.where('like.userId = :userId', { userId: user.id })
			.getCount(),
		pageLikedCount: PageLikes.createQueryBuilder('like')
			.innerJoin('like.page', 'page')
			.where('page.userId = :userId', { userId: user.id })
			.getCount(),
		driveFilesCount: DriveFiles.createQueryBuilder('file')
			.where('file.userId = :userId', { userId: user.id })
			.getCount(),
		driveUsage: DriveFiles.calcDriveUsageOf(user),
	});

	result.followingCount = result.localFollowingCount + result.remoteFollowingCount;
	result.followersCount = result.localFollowersCount + result.remoteFollowersCount;

	return result;
});
