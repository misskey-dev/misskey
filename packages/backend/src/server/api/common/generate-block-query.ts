import { User } from '@/models/entities/user.js';
import { Blockings } from '@/models/index.js';
import { Brackets, SelectQueryBuilder } from 'typeorm';

// ここでいうBlockedは被Blockedの意
export function generateBlockedUserQuery(q: SelectQueryBuilder<any>, me: { id: User['id'] }) {
	const blockingQuery = Blockings.createQueryBuilder('blocking')
		.select('blocking.blockerId')
		.where('blocking.blockeeId = :blockeeId', { blockeeId: me.id });

	// 投稿の作者にブロックされていない かつ
	// 投稿の返信先の作者にブロックされていない かつ
	// 投稿の引用元の作者にブロックされていない
	q
		.andWhere(`note.userId NOT IN (${ blockingQuery.getQuery() })`)
		.andWhere(new Brackets(qb => { qb
			.where(`note.replyUserId IS NULL`)
			.orWhere(`note.replyUserId NOT IN (${ blockingQuery.getQuery() })`);
		}))
		.andWhere(new Brackets(qb => { qb
			.where(`note.renoteUserId IS NULL`)
			.orWhere(`note.renoteUserId NOT IN (${ blockingQuery.getQuery() })`);
		}));

	q.setParameters(blockingQuery.getParameters());
}

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
