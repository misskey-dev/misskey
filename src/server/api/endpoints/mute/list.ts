import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import Mute, { packMany } from '../../../../models/mute';
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
			validator: $.optional.type(ID),
			transform: transform,
		},

		untilId: {
			validator: $.optional.type(ID),
			transform: transform,
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
		muterId: me._id
	} as any;

	const sort = {
		_id: -1
	};

	if (ps.sinceId) {
		sort._id = 1;
		query._id = {
			$gt: ps.sinceId
		};
	} else if (ps.untilId) {
		query._id = {
			$lt: ps.untilId
		};
	}

	const mutes = await Mute
		.find(query, {
			limit: ps.limit,
			sort: sort
		});

	return await packMany(mutes, me);
});
