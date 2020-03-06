import $ from 'cafy';
import define from '../../define';
import { convertLog } from '../../../../services/chart/core';
import { networkChart } from '../../../../services/chart';

export const meta = {
	desc: {
		'ja-JP': 'ネットワークのチャートを取得します。'
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

		offset: {
			validator: $.optional.num,
			default: 0,
		},
	},

	res: convertLog(networkChart.schema),
};

export default define(meta, async (ps) => {
	return await networkChart.getChart(ps.span as any, ps.limit!, ps.offset!);
});
