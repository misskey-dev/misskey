import { User } from '../../../models/entities/user';
import { Brackets, SelectQueryBuilder } from 'typeorm';

export function generateRepliesQuery(q: SelectQueryBuilder<any>, me?: User) {
	if (me == null) {
		q.andWhere(new Brackets(qb => { qb
			.where(`note.replyId IS NULL`) // 返信ではない
			.orWhere(new Brackets(qb => { qb // 返信だけど投稿者自身への返信
				.where(`note.replyId IS NOT NULL`)
				.andWhere('note.replyUserId = note.userId');
			}));
		}));
	} else {
		q.andWhere(new Brackets(qb => { qb
			.where(`note.replyId IS NULL`) // 返信ではない
			.orWhere('note.replyUserId = :meId', { meId: me.id }) // 返信だけど自分のノートへの返信
			.orWhere(new Brackets(qb => { qb // 返信だけど自分の行った返信
				.where(`note.replyId IS NOT NULL`)
				.andWhere('note.userId = :meId', { meId: me.id });
			}))
			.orWhere(new Brackets(qb => { qb // 返信だけど投稿者自身への返信
				.where(`note.replyId IS NOT NULL`)
				.andWhere('note.replyUserId = note.userId');
			}));
		}));
	}
}
