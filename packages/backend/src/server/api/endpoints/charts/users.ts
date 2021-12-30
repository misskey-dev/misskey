import $ from 'cafy';
import define from '../../define';
import { convertLog } from '@/services/chart/core';
import { usersChart } from '@/services/chart/index';

export const meta = {
	tags: ['charts', 'users'],

	params: {
		span: {
			validator: $.str.or(['day', 'hour']),
		},

		limit: {
			validator: $.optional.num.range(1, 500),
			default: 30,
		},

		offset: {
			validator: $.optional.nullable.num,
			default: null,
		},
	},

	res: convertLog(usersChart.schema),
};

export default define(meta, async (ps) => {
	return await usersChart.getChart(ps.span as any, ps.limit!, ps.offset ? new Date(ps.offset) : null);
});
