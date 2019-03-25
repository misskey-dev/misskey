import { User } from '../../../models/entities/user';
import { Mutings } from '../../../models';
import { Brackets } from 'typeorm';

export function generateMuteQuery(me: User) {
	const mutingQuery = Mutings.createQueryBuilder('muting')
		.select('muting.muteeId')
		.where('muting.muterId = :muterId', { muterId: me.id });

	return new Brackets(qb => { qb
		.where(`note.userId NOT IN (${ mutingQuery.getQuery() })`)
		.orWhere(`note.replyUserId NOT IN (${ mutingQuery.getQuery() })`)
		.orWhere(`note.renoteUserId NOT IN (${ mutingQuery.getQuery() })`);
	});
}
