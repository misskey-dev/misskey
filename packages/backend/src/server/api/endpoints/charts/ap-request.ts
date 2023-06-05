import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import ApRequestChart from '@/core/chart/charts/ap-request.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'charts/ap-request'> {
	name = 'charts/ap-request' as const;
	constructor(
		private apRequestChart: ApRequestChart,
	) {
		super(async (ps, me) => {
			return await this.apRequestChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null);
		});
	}
}
