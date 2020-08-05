import { User } from '../../../models/entities/user';
import { ChannelFollowings } from '../../../models';
import { Brackets, SelectQueryBuilder } from 'typeorm';

export function generateChannelQuery(q: SelectQueryBuilder<any>, me?: User | null) {
	if (me == null) {
		q.andWhere('note.channelId IS NULL');
	} else {
		const channelFollowingQuery = ChannelFollowings.createQueryBuilder('channelFollowing')
			.select('channelFollowing.followeeId')
			.where('channelFollowing.followerId = :followerId', { followerId: me.id });

		q.andWhere(new Brackets(qb => { qb
			// チャンネルのノートではない
			.where('note.channelId IS NULL')
			// または自分がフォローしているチャンネルのノート
			.orWhere(`note.channelId IN (${ channelFollowingQuery.getQuery() })`);
		}));

		q.setParameters(channelFollowingQuery.getParameters());
	}
}
