import define from '../../../define.js';
import { Polls, Mutings, Notes, PollVotes } from '@/models/index.js';
import { Brackets, In } from 'typeorm';

export const meta = {
	tags: ['notes'],

	requireCredential: true,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Note',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		offset: { type: 'integer', default: 0 },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
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

	const polls = await query.take(ps.limit).skip(ps.offset).getMany();

	if (polls.length === 0) return [];

	const notes = await Notes.findBy({
		id: In(polls.map(poll => poll.noteId)),
	});

	return await Notes.packMany(notes, user, {
		detail: true,
	});
});
