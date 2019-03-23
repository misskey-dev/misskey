import $ from 'cafy';
import { StringID, NumericalID } from '../../../../misc/cafy-id';
import Blocking, { packMany } from '../../../../models/entities/blocking';
import define from '../../define';

export const meta = {
	desc: {
		'ja-JP': 'ブロックしているユーザー一覧を取得します。',
		'en-US': 'Get blocking users.'
	},

	tags: ['blocking', 'account'],

	requireCredential: true,

	kind: 'following-read',

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 30
		},

		sinceId: {
			validator: $.optional.type(NumericalID),
		},

		untilId: {
			validator: $.optional.type(NumericalID),
		},
	},

	res: {
		type: 'array',
		items: {
			type: 'Blocking',
		}
	},
};

export default define(meta, async (ps, me) => {
	const query = {
		blockerId: me.id
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

	const blockings = await Blocking
		.find(query, {
			take: ps.limit,
			sort: sort
		});

	return await packMany(blockings, me);
});
