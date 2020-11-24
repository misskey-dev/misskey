import $ from 'cafy';
import define from '../../define';
import { ApiError } from '../../error';
import { ID } from '../../../../misc/cafy-id';
import { DriveFiles, Followings, NoteReactions, Notes, PollVotes, Users } from '../../../../models';

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
		followingCount,
		followersCount,
		sentReactionsCount,
		receivedReactionsCount,
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
			.getCount(),
		Followings.createQueryBuilder('following')
			.where('following.followeeId = :userId', { userId: user.id })
			.getCount(),
		NoteReactions.createQueryBuilder('reaction')
			.where('reaction.userId = :userId', { userId: user.id })
			.getCount(),
		NoteReactions.createQueryBuilder('reaction')
			.innerJoin('reaction.note', 'note')
			.where('note.userId = :userId', { userId: user.id })
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
		followingCount,
		followersCount,
		sentReactionsCount,
		receivedReactionsCount,
		driveFilesCount,
		driveUsage,
	};
});
