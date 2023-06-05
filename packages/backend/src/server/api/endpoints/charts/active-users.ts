import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import ActiveUsersChart from '@/core/chart/charts/active-users.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'charts/active-users'> {
	name = 'charts/active-users' as const;
	constructor(
		private activeUsersChart: ActiveUsersChart,
	) {
		super(async (ps, me) => {
			return await this.activeUsersChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null);
		});
	}
}
