import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import PerUserDriveChart from '@/core/chart/charts/per-user-drive.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'charts/user/drive'> {
	name = 'charts/user/drive' as const;
	constructor(
		private perUserDriveChart: PerUserDriveChart,
	) {
		super(async (ps, me) => {
			return await this.perUserDriveChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null, ps.userId);
		});
	}
}
