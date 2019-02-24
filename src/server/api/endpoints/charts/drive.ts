import $ from 'cafy';
import define from '../../define';
import driveChart, { driveLogSchema } from '../../../../services/chart/drive';
import { convertLog } from '../../../../services/chart';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': 'ドライブのチャートを取得します。'
	},

	tags: ['charts', 'drive'],

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
	},

	res: convertLog(driveLogSchema),
};

export default define(meta, async (ps) => {
	return await driveChart.getChart(ps.span as any, ps.limit);
});
