import define from '../../define';
import { convertLog } from '@/services/chart/core';
import { notesChart } from '@/services/chart/index';

export const meta = {
	tags: ['charts', 'notes'],

	// TODO: response definition
} as const;

const paramDef = {
	type: 'object',
	properties: {
		span: { type: 'string', enum: ['day', 'hour'] },
		limit: { type: 'integer', minimum: 1, maximum: 500, default: 30 },
		offset: { type: 'integer', nullable: true, default: null },
	},
	required: ['span'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps) => {
	return await notesChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null);
});
