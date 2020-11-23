import $ from 'cafy';
import define from '../../define';
import { ApiError } from '../../error';
import { ID } from '../../../../misc/cafy-id';
import { Followings, NoteReactions, Notes, Users } from '../../../../models';

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
		followingCount,
		followersCount,
		sentReactionsCount,
		receivedReactionsCount
	] = await Promise.all([
		Notes.createQueryBuilder('note')
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
	]);

	return {
		notesCount,
		followingCount,
		followersCount,
		sentReactionsCount,
		receivedReactionsCount,
	};
});
