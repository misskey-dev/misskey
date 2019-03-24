import { User } from '../../../models/entities/user';
import { Followings } from '../../../models';
import { Brackets } from 'typeorm';

export function generateVisibilityQuery(me?: User) {
	if (me == null) {
		return new Brackets(qb => {
			qb.where('note.visibility = \'public\' OR note.visibility = \'home\'');
		});
	} else {
		const followingQuery = Followings.createQueryBuilder('following')
			.select('following.followeeId')
			.where('following.followerId = :userId', { userId: me.id });

		return new Brackets(qb => { qb
			// 公開投稿である
			.where('note.visibility = \'public\' OR note.visibility = \'home\'')
			// または 自分自身
			.orWhere('note.userId = :userId', { userId: me.id })
			// または 自分宛て
			.orWhere('note.visibleUserIds ANY(:userId)', { userId: me.id })
			.orWhere(new Brackets(qb => { qb
				// または フォロワー宛ての投稿であり、
				.where('note.visibility = \'followers\'')
				.andWhere(new Brackets(qb => { qb
					// 自分がフォロワーである
					.where(`note.userId IN (${ followingQuery.getQuery() })`)
					// または 自分の投稿へのリプライ
					.orWhere('note.replyUserId = :userId', { userId: me.id })
					// または 自分へのメンションが含まれている
					.orWhere('note.mentions ANY(:userId)', { userId: me.id });
				}));
			}));
		});
	}
}
