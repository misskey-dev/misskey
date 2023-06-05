import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import PerUserFollowingChart from '@/core/chart/charts/per-user-following.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'charts/user/following'> {
	name = 'charts/user/following' as const;
	constructor(
		private perUserFollowingChart: PerUserFollowingChart,
	) {
		super(async (ps, me) => {
			return await this.perUserFollowingChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null, ps.userId);
		});
	}
}
