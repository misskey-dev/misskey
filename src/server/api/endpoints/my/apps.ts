import $ from 'cafy';
import define from '../../define';
import { Apps } from '../../../../models';

export const meta = {
	tags: ['account', 'app'],

	desc: {
		'ja-JP': '自分のアプリケーション一覧を取得します。',
		'en-US': 'Get my apps'
	},

	requireCredential: true as const,

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
		userId: user.id
	};

	const apps = await Apps.find({
		where: query,
		take: ps.limit!,
		skip: ps.offset,
	});

	return await Promise.all(apps.map(app => Apps.pack(app, user, {
		detail: true
	})));
});
