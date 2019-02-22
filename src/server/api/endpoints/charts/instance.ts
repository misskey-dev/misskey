import $ from 'cafy';
import define from '../../define';
import instanceChart from '../../../../services/chart/instance';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': 'インスタンスごとのチャートを取得します。'
	},

	tags: ['charts'],

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

		host: {
			validator: $.str,
			desc: {
				'ja-JP': '対象のインスタンスのホスト',
				'en-US': 'Target instance host'
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
	return await instanceChart.getChart(ps.span as any, ps.limit, ps.host);
});
