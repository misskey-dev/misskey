import $ from 'cafy';
import App, { pack } from '../../../../models/app';
import { ILocalUser } from '../../../../models/user';
import getParams from '../../get-params';

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

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

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
});
