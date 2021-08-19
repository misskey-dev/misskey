import { User } from '@/models/entities/user.js';
import { Mutings } from '@/models/index.js';
import { SelectQueryBuilder, Brackets } from 'typeorm';

export function generateMutedUserQuery(q: SelectQueryBuilder<any>, me: { id: User['id'] }, exclude?: User) {
	const mutingQuery = Mutings.createQueryBuilder('muting')
		.select('muting.muteeId')
		.where('muting.muterId = :muterId', { muterId: me.id });

	if (exclude) {
		mutingQuery.andWhere('muting.muteeId != :excludeId', { excludeId: exclude.id });
	}

	// 投稿の作者をミュートしていない かつ
	// 投稿の返信先の作者をミュートしていない かつ
	// 投稿の引用元の作者をミュートしていない
	q
		.andWhere(`note.userId NOT IN (${ mutingQuery.getQuery() })`)
		.andWhere(new Brackets(qb => { qb
			.where(`note.replyUserId IS NULL`)
			.orWhere(`note.replyUserId NOT IN (${ mutingQuery.getQuery() })`);
		}))
		.andWhere(new Brackets(qb => { qb
			.where(`note.renoteUserId IS NULL`)
			.orWhere(`note.renoteUserId NOT IN (${ mutingQuery.getQuery() })`);
		}));

	q.setParameters(mutingQuery.getParameters());
}

export function generateMutedUserQueryForUsers(q: SelectQueryBuilder<any>, me: { id: User['id'] }) {
	const mutingQuery = Mutings.createQueryBuilder('muting')
		.select('muting.muteeId')
		.where('muting.muterId = :muterId', { muterId: me.id });

	q
		.andWhere(`user.id NOT IN (${ mutingQuery.getQuery() })`);

	q.setParameters(mutingQuery.getParameters());
}
