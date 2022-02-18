import define from '../../define';
import { convertLog } from '@/services/chart/core';
import { instanceChart } from '@/services/chart/index';

export const meta = {
	tags: ['charts'],

	// TODO: response definition
} as const;

const paramDef = {
	type: 'object',
	properties: {
		span: { type: 'string', enum: ['day', 'hour'] },
		limit: { type: 'integer', maximum: 500, default: 30 },
		offset: { type: 'integer', nullable: true, default: null },
		host: { type: 'string' },
	},
	required: ['span', 'host'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps) => {
	return await instanceChart.getChart(ps.span as any, ps.limit, ps.offset ? new Date(ps.offset) : null, ps.host);
});
