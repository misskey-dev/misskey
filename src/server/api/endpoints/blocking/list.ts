import $ from 'cafy'; import ID from '../../../../misc/cafy-id';
import Blocking, { packMany } from '../../../../models/blocking';
import { ILocalUser } from '../../../../models/user';
import getParams from '../../get-params';

export const meta = {
	desc: {
		'ja-JP': 'ブロックしているユーザー一覧を取得します。',
		'en-US': 'Get blocking users.'
	},

	requireCredential: true,

	kind: 'following-read',

	params: {
		limit: $.num.optional.range(1, 100).note({
			default: 30
		}),

		sinceId: $.type(ID).optional.note({
		}),

		untilId: $.type(ID).optional.note({
		}),
	}
};

export default (params: any, me: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	// Check if both of sinceId and untilId is specified
	if (ps.sinceId && ps.untilId) {
		return rej('cannot set sinceId and untilId');
	}

	const query = {
		blockerId: me._id
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

	const blockings = await Blocking
		.find(query, {
			limit: ps.limit,
			sort: sort
		});

	res(await packMany(blockings, me));
});
