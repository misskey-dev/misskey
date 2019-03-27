import { User } from '../../../models/entities/user';
import { Mutings } from '../../../models';
import { SelectQueryBuilder } from 'typeorm';

export function generateMuteQuery(q: SelectQueryBuilder<any>, me: User) {
	const mutingQuery = Mutings.createQueryBuilder('muting')
		.select('muting.muteeId')
		.where('muting.muterId = :muterId', { muterId: me.id });

	q
		.andWhere(`note.userId NOT IN (${ mutingQuery.getQuery() })`)
		.andWhere(`note.replyUserId NOT IN (${ mutingQuery.getQuery() })`)
		.andWhere(`note.renoteUserId NOT IN (${ mutingQuery.getQuery() })`);

	q.setParameters(mutingQuery.getParameters());
}
