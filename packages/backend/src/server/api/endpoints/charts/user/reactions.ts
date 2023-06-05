import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import PerUserReactionsChart from '@/core/chart/charts/per-user-reactions.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'charts/user/reactions'> {
	name = 'charts/user/reactions' as const;
	constructor(
		private perUserReactionsChart: PerUserReactionsChart,
	) {
		super(async (ps, me) => {
			return await this.perUserReactionsChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null, ps.userId);
		});
	}
}
