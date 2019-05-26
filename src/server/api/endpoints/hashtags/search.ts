import $ from 'cafy';
import define from '../../define';
import { Hashtags } from '../../../../models';
import { types, bool } from '../../../../misc/schema';

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
	},

	res: {
		type: types.array,
		optional: bool.false, nullable: bool.false,
		items: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
		}
	},
};

export default define(meta, async (ps) => {
	const hashtags = await Hashtags.createQueryBuilder('tag')
		.where('tag.name like :q', { q: ps.query.toLowerCase() + '%' })
		.orderBy('tag.count', 'DESC')
		.groupBy('tag.id')
		.take(ps.limit!)
		.skip(ps.offset)
		.getMany();

	return hashtags.map(tag => tag.name);
});
