import $ from 'cafy';
import { StringID, NumericalID } from '../../../../misc/cafy-id';
import Mute, { packMany } from '../../../../models/entities/muting';
import define from '../../define';

export const meta = {
	desc: {
		'ja-JP': 'ミュートしているユーザー一覧を取得します。',
		'en-US': 'Get muted users.'
	},

	tags: ['mute', 'account'],

	requireCredential: true,

	kind: 'account/read',

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
			type: 'Muting',
		}
	},
};

export default define(meta, async (ps, me) => {
	const query = {
		muterId: me.id
	} as any;

	const sort = {
		id: -1
	};

	if (ps.sinceId) {
		sort.id = 1;
		query.id = {
			$gt: ps.sinceId
		};
	} else if (ps.untilId) {
		query.id = {
			$lt: ps.untilId
		};
	}

	const mutes = await Mute
		.find(query, {
			take: ps.limit,
			sort: sort
		});

	return await packMany(mutes, me);
});
