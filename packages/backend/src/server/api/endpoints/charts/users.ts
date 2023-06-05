import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import UsersChart from '@/core/chart/charts/users.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'charts/users'> {
	name = 'charts/users' as const;
	constructor(
		private usersChart: UsersChart,
	) {
		super(async (ps, me) => {
			return await this.usersChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null);
		});
	}
}
