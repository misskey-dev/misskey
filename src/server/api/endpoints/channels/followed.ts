import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import { Channels, ChannelFollowings } from '../../../../models';

export const meta = {
	tags: ['channels', 'account'],

	requireCredential: true as const,

	kind: 'read:channels',

	params: {
		sinceId: {
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 5
		},
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'Channel',
		}
	},
};

export default define(meta, async (ps, me) => {
	const query = ChannelFollowings.createQueryBuilder('following').andWhere({ followerId: me.id });
	if (ps.sinceId) {
		query.andWhere('following."followeeId" > :sinceId', { sinceId: ps.sinceId });
	}
	if (ps.untilId) {
		query.andWhere('following."followeeId" < :untilId', { untilId: ps.untilId });
	}
	if (ps.sinceId && !ps.untilId) {
		query.orderBy('following."followeeId"', 'ASC');
	} else {
		query.orderBy('following."followeeId"', 'DESC');
	}

	const followings = await query
		.take(ps.limit!)
		.getMany();

	return await Promise.all(followings.map(x => Channels.pack(x.followeeId, me)));
});
