import { Brackets, In } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { Notes } from '@/models/index.js';
import { Polls, Mutings, PollVotes } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';

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
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('notesRepository')
		private notesRepository: typeof Notes,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = Polls.createQueryBuilder('poll')
				.where('poll.userHost IS NULL')
				.andWhere('poll.userId != :meId', { meId: me.id })
				.andWhere('poll.noteVisibility = \'public\'')
				.andWhere(new Brackets(qb => { qb
					.where('poll.expiresAt IS NULL')
					.orWhere('poll.expiresAt > :now', { now: new Date() });
				}));

			//#region exclude arleady voted polls
			const votedQuery = PollVotes.createQueryBuilder('vote')
				.select('vote.noteId')
				.where('vote.userId = :meId', { meId: me.id });

			query
				.andWhere(`poll.noteId NOT IN (${ votedQuery.getQuery() })`);

			query.setParameters(votedQuery.getParameters());
			//#endregion

			//#region mute
			const mutingQuery = this.mutingsRepository.createQueryBuilder('muting')
				.select('muting.muteeId')
				.where('muting.muterId = :muterId', { muterId: me.id });

			query
				.andWhere(`poll.userId NOT IN (${ mutingQuery.getQuery() })`);

			query.setParameters(mutingQuery.getParameters());
			//#endregion

			const polls = await query
				.orderBy('poll.noteId', 'DESC')
				.take(ps.limit)
				.skip(ps.offset)
				.getMany();

			if (polls.length === 0) return [];

			const notes = await this.notesRepository.find({
				where: {
					id: In(polls.map(poll => poll.noteId)),
				},
				order: {
					createdAt: 'DESC',
				},
			});

			return await this.notesRepository.packMany(notes, me, {
				detail: true,
			});
		});
	}
}
