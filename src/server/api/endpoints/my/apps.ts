import $ from 'cafy';
import App, { pack } from '../../../../models/app';
import define from '../../define';

export const meta = {
	desc: {
		'ja-JP': '自分のアプリケーション一覧を取得します。',
		'en-US': 'Get my apps'
	},

	requireCredential: true,

	params: {
		limit: {
			validator: $.num.optional.range(1, 100),
			default: 10
		},

		offset: {
			validator: $.num.optional.min(0),
			default: 0
		}
	}
};

export default define(meta, (ps, user) => App.find({ userId: user._id }, {
		limit: ps.limit,
		skip: ps.offset,
		sort: { _id: -1 }
	})
	.then(x => Promise.all(x.map(x => pack(x, user, { detail: true })))));
