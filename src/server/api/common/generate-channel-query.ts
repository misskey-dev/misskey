import { User } from '../../../models/entities/user';
import { ChannelFollowings } from '../../../models';
import { Brackets, SelectQueryBuilder } from 'typeorm';

export function generateChannelQuery(q: SelectQueryBuilder<any>, me?: { id: User['id'] } | null) {
	if (me == null) {
		q.andWhere('note.channelId IS NULL');
	} else {
		q.leftJoinAndSelect('note.channel', 'channel');

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
