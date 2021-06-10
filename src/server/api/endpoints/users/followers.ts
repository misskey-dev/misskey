import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { ApiError } from '../../error';
import { Users, Followings } from '../../../../models';
import { makePaginationQuery } from '../../common/make-pagination-query';
import { toPunyNullable } from '@/misc/convert-host';

export const meta = {
	tags: ['users'],

	requireCredential: false as const,

	params: {
		userId: {
			validator: $.optional.type(ID),
		},

		username: {
			validator: $.optional.str
		},

		host: {
			validator: $.optional.nullable.str
		},

		sinceId: {
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'Following',
		}
	},

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '27fa5435-88ab-43de-9360-387de88727cd'
		}
	}
};

export default define(meta, async (ps, me) => {
	const user = await Users.findOne(ps.userId != null
		? { id: ps.userId }
		: { usernameLower: ps.username!.toLowerCase(), host: toPunyNullable(ps.host) });

	if (user == null) {
		throw new ApiError(meta.errors.noSuchUser);
	}

	const query = makePaginationQuery(Followings.createQueryBuilder('following'), ps.sinceId, ps.untilId)
		.andWhere(`following.followeeId = :userId`, { userId: user.id })
		.innerJoinAndSelect('following.follower', 'follower');

	const followings = await query
		.take(ps.limit!)
		.getMany();

	return await Followings.packMany(followings, me, { populateFollower: true });
});
