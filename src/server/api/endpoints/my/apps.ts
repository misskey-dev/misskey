import $ from 'cafy';
import App, { pack } from '../../../../models/app';
import define from '../../define';

export const meta = {
	tags: ['account', 'app'],

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

export default define(meta, async (ps, user) => {
	const query = {
		userId: user._id
	};

	const apps = await App
		.find(query, {
			limit: ps.limit,
			skip: ps.offset,
			sort: {
				_id: -1
			}
		});

	return await Promise.all(apps.map(app => pack(app, user, {
		detail: true
	})));
});
