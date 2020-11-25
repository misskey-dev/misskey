import $ from 'cafy';
import define from '../../define';
import { ApiError } from '../../error';
import { ID } from '../../../../misc/cafy-id';
import { DriveFiles, Followings, NoteFavorites, NoteReactions, Notes, PageLikes, PollVotes, ReversiGames, Users } from '../../../../models';

export const meta = {
	tags: ['users'],

	requireCredential: false as const,

	params: {
		userId: {
			validator: $.type(ID),
		},
	},

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '9e638e45-3b25-4ef7-8f95-07e8498f1819'
		},
	}
};

export default define(meta, async (ps, me) => {
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
		reversiCount,
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
		ReversiGames.createQueryBuilder('game')
			.where('game.user1Id = :userId', { userId: user.id })
			.orWhere('game.user2Id = :userId', { userId: user.id })
			.getCount(),
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
		reversiCount,
	};
});
