import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import InstanceChart from '@/core/chart/charts/instance.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'charts/instance'> {
	name = 'charts/instance' as const;
	constructor(
		private instanceChart: InstanceChart,
	) {
		super(async (ps, me) => {
			return await this.instanceChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null, ps.host);
		});
	}
}
