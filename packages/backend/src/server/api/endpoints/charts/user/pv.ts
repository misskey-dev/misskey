import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import PerUserPvChart from '@/core/chart/charts/per-user-pv.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'charts/user/pv'> {
	name = 'charts/user/pv' as const;
	constructor(
		private perUserPvChart: PerUserPvChart,
	) {
		super(async (ps, me) => {
			return await this.perUserPvChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null, ps.userId);
		});
	}
}
