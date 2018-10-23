import $ from 'cafy';
import getParams from '../../get-params';
import usersChart from '../../../../chart/users';

export const meta = {
	desc: {
		'ja-JP': 'ユーザーのチャートを取得します。'
	},

	params: {
		span: $.str.or(['day', 'hour']).note({
			desc: {
				'ja-JP': '集計のスパン (day または hour)'
			}
		}),

		limit: $.num.optional.range(1, 100).note({
			default: 30,
			desc: {
				'ja-JP': '最大数。例えば 30 を指定したとすると、スパンが"day"の場合は30日分のデータが、スパンが"hour"の場合は30時間分のデータが返ります。'
			}
		}),
	}
};

export default (params: any) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) throw psErr;

	const stats = await usersChart.getChart(ps.span as any, ps.limit);

	res(stats);
});
