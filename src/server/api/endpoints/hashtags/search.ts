import $ from 'cafy';
import Hashtag from '../../../../models/hashtag';
import getParams from '../../get-params';
const escapeRegexp = require('escape-regexp');

export const meta = {
	desc: {
		'ja-JP': 'ハッシュタグを検索します。'
	},

	requireCredential: false,

	params: {
		limit: $.num.optional.range(1, 100).note({
			default: 10,
			desc: {
				'ja-JP': '最大数'
			}
		}),

		query: $.str.note({
			desc: {
				'ja-JP': 'クエリ'
			}
		}),

		offset: $.num.optional.min(0).note({
			default: 0,
			desc: {
				'ja-JP': 'オフセット'
			}
		})
	}
};

export default (params: any) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	const hashtags = await Hashtag
		.find({
			tag: new RegExp('^' + escapeRegexp(ps.query.toLowerCase()))
		}, {
			sort: {
				count: -1
			},
			limit: ps.limit,
			skip: ps.offset
		});

	res(hashtags.map(tag => tag.tag));
});
