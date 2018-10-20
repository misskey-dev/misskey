import $ from 'cafy';
import getParams from '../get-params';
import { coreChart } from '../../../services/stats';

export const meta = {
	desc: {
		'ja-JP': 'インスタンスの統計を取得します。'
	},

	params: {
		limit: $.num.optional.range(1, 100).note({
			default: 30,
			desc: {
				'ja-JP': '最大数'
			}
		}),
	}
};

export default (params: any) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) throw psErr;

	const [statsPerDay, statsPerHour] = await Promise.all([
		coreChart.getStats('day', ps.limit),
		coreChart.getStats('hour', ps.limit)
	]);

	res({
		perDay: statsPerDay,
		perHour: statsPerHour
	});
});
