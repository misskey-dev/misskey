import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import PerUserNotesChart from '@/core/chart/charts/per-user-notes.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'charts/user/notes'> {
	name = 'charts/user/notes' as const;
	constructor(
		private perUserNotesChart: PerUserNotesChart,
	) {
		super(async (ps, me) => {
			return await this.perUserNotesChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null, ps.userId);
		});
	}
}
