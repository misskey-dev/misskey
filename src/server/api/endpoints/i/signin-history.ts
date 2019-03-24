import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import Signin, { pack } from '../../../../models/entities/signin';
import define from '../../define';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		sinceId: {
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		}
	}
};

export default define(meta, async (ps, user) => {
	const query = {
		userId: user.id
	} as any;

	const sort = {
		id: -1
	};

	if (ps.sinceId) {
		sort.id = 1;
		query.id = MoreThan(ps.sinceId);
	} else if (ps.untilId) {
		query.id = LessThan(ps.untilId);
	}

	const history = await Signin
		.find(query, {
			take: ps.limit,
			order: sort
		});

	return await Promise.all(history.map(record => pack(record)));
});
