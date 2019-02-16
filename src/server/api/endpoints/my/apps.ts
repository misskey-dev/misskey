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
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		offset: {
			validator: $.optional.num.min(0),
			default: 0
		}
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	const query = {
		userId: user._id
	};

	// Execute query
	const apps = await App
		.find(query, {
			limit: ps.limit,
			skip: ps.offset,
			sort: {
				_id: -1
			}
		});

	// Reply
	res(await Promise.all(apps.map(app => pack(app, user, {
		detail: true
	}))));
}));
