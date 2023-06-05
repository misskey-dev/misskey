import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import DriveChart from '@/core/chart/charts/drive.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'charts/drive'> {
	name = 'charts/drive' as const;
	constructor(
		private driveChart: DriveChart,
	) {
		super(async (ps, me) => {
			return await this.driveChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null);
		});
	}
}
