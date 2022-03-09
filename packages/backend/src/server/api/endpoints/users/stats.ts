import define from '../../define.js';
import { ApiError } from '../../error.js';
import { DriveFiles, Followings, NoteFavorites, NoteReactions, Notes, PageLikes, PollVotes, Users } from '@/models/index.js';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '9e638e45-3b25-4ef7-8f95-07e8498f1819',
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
	const user = await Users.findOne(ps.userId);
	if (user == null) {
		throw new ApiError(meta.errors.noSuchUser);
	}

	const [
		notesCount,
		repliesCount,
		renotesCount,
		repliedCount,
		renotedCount,
		pollVotesCount,
		pollVotedCount,
		localFollowingCount,
		remoteFollowingCount,
		localFollowersCount,
		remoteFollowersCount,
		sentReactionsCount,
		receivedReactionsCount,
		noteFavoritesCount,
		pageLikesCount,
		pageLikedCount,
		driveFilesCount,
		driveUsage,
	] = await Promise.all([
		Notes.createQueryBuilder('note')
			.where('note.userId = :userId', { userId: user.id })
			.getCount(),
		Notes.createQueryBuilder('note')
			.where('note.userId = :userId', { userId: user.id })
			.andWhere('note.replyId IS NOT NULL')
			.getCount(),
		Notes.createQueryBuilder('note')
			.where('note.userId = :userId', { userId: user.id })
			.andWhere('note.renoteId IS NOT NULL')
			.getCount(),
		Notes.createQueryBuilder('note')
			.where('note.replyUserId = :userId', { userId: user.id })
			.getCount(),
		Notes.createQueryBuilder('note')
			.where('note.renoteUserId = :userId', { userId: user.id })
			.getCount(),
		PollVotes.createQueryBuilder('vote')
			.where('vote.userId = :userId', { userId: user.id })
			.getCount(),
		PollVotes.createQueryBuilder('vote')
			.innerJoin('vote.note', 'note')
			.where('note.userId = :userId', { userId: user.id })
			.getCount(),
		Followings.createQueryBuilder('following')
			.where('following.followerId = :userId', { userId: user.id })
			.andWhere('following.followeeHost IS NULL')
			.getCount(),
		Followings.createQueryBuilder('following')
			.where('following.followerId = :userId', { userId: user.id })
			.andWhere('following.followeeHost IS NOT NULL')
			.getCount(),
		Followings.createQueryBuilder('following')
			.where('following.followeeId = :userId', { userId: user.id })
			.andWhere('following.followerHost IS NULL')
			.getCount(),
		Followings.createQueryBuilder('following')
			.where('following.followeeId = :userId', { userId: user.id })
			.andWhere('following.followerHost IS NOT NULL')
			.getCount(),
		NoteReactions.createQueryBuilder('reaction')
			.where('reaction.userId = :userId', { userId: user.id })
			.getCount(),
		NoteReactions.createQueryBuilder('reaction')
			.innerJoin('reaction.note', 'note')
			.where('note.userId = :userId', { userId: user.id })
			.getCount(),
		NoteFavorites.createQueryBuilder('favorite')
			.where('favorite.userId = :userId', { userId: user.id })
			.getCount(),
		PageLikes.createQueryBuilder('like')
			.where('like.userId = :userId', { userId: user.id })
			.getCount(),
		PageLikes.createQueryBuilder('like')
			.innerJoin('like.page', 'page')
			.where('page.userId = :userId', { userId: user.id })
			.getCount(),
		DriveFiles.createQueryBuilder('file')
			.where('file.userId = :userId', { userId: user.id })
			.getCount(),
		DriveFiles.calcDriveUsageOf(user),
	]);

	return {
		notesCount,
		repliesCount,
		renotesCount,
		repliedCount,
		renotedCount,
		pollVotesCount,
		pollVotedCount,
		localFollowingCount,
		remoteFollowingCount,
		localFollowersCount,
		remoteFollowersCount,
		followingCount: localFollowingCount + remoteFollowingCount,
		followersCount: localFollowersCount + remoteFollowersCount,
		sentReactionsCount,
		receivedReactionsCount,
		noteFavoritesCount,
		pageLikesCount,
		pageLikedCount,
		driveFilesCount,
		driveUsage,
	};
});
