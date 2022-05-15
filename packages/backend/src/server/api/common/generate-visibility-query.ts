import { User } from '@/models/entities/user.js';
import { Followings } from '@/models/index.js';
import { Brackets, SelectQueryBuilder } from 'typeorm';

export function generateVisibilityQuery(q: SelectQueryBuilder<any>, me?: { id: User['id'] } | null) {
	// This code must always be synchronized with the checks in Notes.isVisibleForMe.
	if (me == null) {
		q.andWhere(new Brackets(qb => { qb
			.where(`note.visibility = 'public'`)
			.orWhere(`note.visibility = 'home'`);
		}));
	} else {
		const followingQuery = Followings.createQueryBuilder('following')
			.select('following.followeeId')
			.where('following.followerId = :meId');

		q.andWhere(new Brackets(qb => { qb
			// 公開投稿である
			.where(new Brackets(qb => { qb
				.where(`note.visibility = 'public'`)
				.orWhere(`note.visibility = 'home'`);
			}))
			// または 自分自身
			.orWhere('note.userId = :meId')
			// または 自分宛て
			.orWhere(':meId = ANY(note.visibleUserIds)')
			.orWhere(':meId = ANY(note.mentions)')
			.orWhere(new Brackets(qb => { qb
				// または フォロワー宛ての投稿であり、
				.where(`note.visibility = 'followers'`)
				.andWhere(new Brackets(qb => { qb
					// 自分がフォロワーである
					.where(`note.userId IN (${ followingQuery.getQuery() })`)
					// または 自分の投稿へのリプライ
					.orWhere('note.replyUserId = :meId');
				}));
			}));
		}));

		q.setParameters({ meId: me.id });
	}
}
