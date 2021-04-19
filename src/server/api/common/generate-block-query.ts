import { User } from '../../../models/entities/user';
import { Blockings } from '../../../models';
import { SelectQueryBuilder } from 'typeorm';

export function generateBlockQueryForUsers(q: SelectQueryBuilder<any>, me: { id: User['id'] }) {
	const blockingQuery = Blockings.createQueryBuilder('blocking')
		.select('blocking.blockeeId')
		.where('blocking.blockerId = :blockerId', { blockerId: me.id });

	const blockedQuery = Blockings.createQueryBuilder('blocking')
		.select('blocking.blockerId')
		.where('blocking.blockeeId = :blockeeId', { blockeeId: me.id });

	q.andWhere(`user.id NOT IN (${ blockingQuery.getQuery() })`);
	q.setParameters(blockingQuery.getParameters());

	q.andWhere(`user.id NOT IN (${ blockedQuery.getQuery() })`);
	q.setParameters(blockedQuery.getParameters());
}
