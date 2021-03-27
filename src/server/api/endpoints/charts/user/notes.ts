import $ from 'cafy';
import define from '../../../define';
import { ID } from '@/misc/cafy-id';
import { convertLog } from '../../../../../services/chart/core';
import { perUserNotesChart } from '../../../../../services/chart';

export const meta = {
	desc: {
		'ja-JP': 'ユーザーごとの投稿のチャートを取得します。'
	},

	tags: ['charts', 'users', 'notes'],

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
			validator: $.optional.nullable.num,
			default: null,
		},

		userId: {
			validator: $.type(ID),
			desc: {
				'ja-JP': '対象のユーザーのID',
				'en-US': 'Target user ID'
			}
		}
	},

	res: convertLog(perUserNotesChart.schema),
};

export default define(meta, async (ps) => {
	return await perUserNotesChart.getChart(ps.span as any, ps.limit!, ps.offset ? new Date(ps.offset) : null, ps.userId);
});
