import $ from 'cafy';
import define from '../../../define';
import perUserReactionsChart from '../../../../../services/chart/per-user-reactions';
import ID, { transform } from '../../../../../misc/cafy-id';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': 'ユーザーごとの被リアクション数のチャートを取得します。'
	},

	tags: ['charts', 'users', 'reactions'],

	params: {
		span: {
			validator: $.str.or(['day', 'hour']),
			desc: {
				'ja-JP': '集計のスパン (day または hour)'
			}
		},

		limit: {
			validator: $.optional.num.range(1, 500),
			default: 30,
			desc: {
				'ja-JP': '最大数。例えば 30 を指定したとすると、スパンが"day"の場合は30日分のデータが、スパンが"hour"の場合は30時間分のデータが返ります。'
			}
		},

		userId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のユーザーのID',
				'en-US': 'Target user ID'
			}
		}
	},

	res: {
		type: 'array',
		items: {
			type: 'object',
		},
	},
};

export default define(meta, async (ps) => {
	return await perUserReactionsChart.getChart(ps.span as any, ps.limit, ps.userId);
});
