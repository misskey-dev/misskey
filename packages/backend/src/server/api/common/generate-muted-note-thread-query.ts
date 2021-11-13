import { User } from '@/models/entities/user';
import { NoteThreadMutings } from '@/models/index';
import { Brackets, SelectQueryBuilder } from 'typeorm';

export function generateMutedNoteThreadQuery(q: SelectQueryBuilder<any>, me: { id: User['id'] }) {
	const mutedQuery = NoteThreadMutings.createQueryBuilder('threadMuted')
		.select('threadMuted.threadId')
		.where('threadMuted.userId = :userId', { userId: me.id });

	q.andWhere(`note.id NOT IN (${ mutedQuery.getQuery() })`);
	q.andWhere(new Brackets(qb => { qb
		.where(`note.threadId IS NULL`)
		.orWhere(`note.threadId NOT IN (${ mutedQuery.getQuery() })`);
	}));

	q.setParameters(mutedQuery.getParameters());
}
