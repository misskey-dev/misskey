import $ from 'cafy';
import Hashtag from '../../../../models/hashtag';
import define from '../../define';
import * as escapeRegexp from 'escape-regexp';

export const meta = {
	desc: {
		'ja-JP': 'ハッシュタグを検索します。'
	},

	tags: ['hashtags'],

	requireCredential: false,

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10,
			desc: {
				'ja-JP': '最大数'
			}
		},

		query: {
			validator: $.str,
			desc: {
				'ja-JP': 'クエリ'
			}
		},

		offset: {
			validator: $.optional.num.min(0),
			default: 0,
			desc: {
				'ja-JP': 'オフセット'
			}
		}
	}
};

export default define(meta, async (ps) => {
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

	return hashtags.map(tag => tag.tag);
});
