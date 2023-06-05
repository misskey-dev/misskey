import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import NotesChart from '@/core/chart/charts/notes.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'charts/notes'> {
	name = 'charts/notes' as const;
	constructor(
		private notesChart: NotesChart,
	) {
		super(async (ps, me) => {
			return await this.notesChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null);
		});
	}
}
