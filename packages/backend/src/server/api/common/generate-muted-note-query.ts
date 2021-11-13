import { User } from '@/models/entities/user';
import { MutedNotes } from '@/models/index';
import { SelectQueryBuilder } from 'typeorm';

export function generateMutedNoteQuery(q: SelectQueryBuilder<any>, me: { id: User['id'] }) {
	const mutedQuery = MutedNotes.createQueryBuilder('muted')
		.select('muted.noteId')
		.where('muted.userId = :userId', { userId: me.id });

	q.andWhere(`note.id NOT IN (${ mutedQuery.getQuery() })`);

	q.setParameters(mutedQuery.getParameters());
}
