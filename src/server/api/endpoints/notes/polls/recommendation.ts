import $ from 'cafy';
import define from '../../../define';
import { Polls, Mutings, Notes, PollVotes } from '../../../../../models';
import { Brackets, In } from 'typeorm';

export const meta = {
	desc: {
		'ja-JP': 'おすすめのアンケート一覧を取得します。',
		'en-US': 'Get recommended polls.'
	},

	tags: ['notes'],

	requireCredential: true as const,

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		offset: {
			validator: $.optional.num.min(0),
			default: 0
		}
	}
};

export default define(meta, async (ps, user) => {
	const query = Polls.createQueryBuilder('poll')
		.where('poll.userHost IS NULL')
		.andWhere(`poll.userId != :meId`, { meId: user.id })
		.andWhere(`poll.noteVisibility = 'public'`)
		.andWhere(new Brackets(qb => { qb
			.where('poll.expiresAt IS NULL')
			.orWhere('poll.expiresAt > :now', { now: new Date() });
		}));

	//#region exclude arleady voted polls
	const votedQuery = PollVotes.createQueryBuilder('vote')
		.select('vote.noteId')
		.where('vote.userId = :meId', { meId: user.id });

	query
		.andWhere(`poll.noteId NOT IN (${ votedQuery.getQuery() })`);

	query.setParameters(votedQuery.getParameters());
	//#endregion

	//#region mute
	const mutingQuery = Mutings.createQueryBuilder('muting')
		.select('muting.muteeId')
		.where('muting.muterId = :muterId', { muterId: user.id });

	query
		.andWhere(`poll.userId NOT IN (${ mutingQuery.getQuery() })`);

	query.setParameters(mutingQuery.getParameters());
	//#endregion

	const polls = await query.take(ps.limit!).skip(ps.offset).getMany();

	if (polls.length === 0) return [];

	const notes = await Notes.find({
		id: In(polls.map(poll => poll.noteId))
	});

	return await Notes.packMany(notes, user, {
		detail: true
	});
});
