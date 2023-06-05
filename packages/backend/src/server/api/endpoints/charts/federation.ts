import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import FederationChart from '@/core/chart/charts/federation.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'charts/federation'> {
	name = 'charts/federation' as const;
	constructor(
		private federationChart: FederationChart,
	) {
		super(async (ps, me) => {
			return await this.federationChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null);
		});
	}
}
