import define from '../../../define.js';
import { getJsonSchema } from '@/services/chart/core.js';
import { perUserDriveChart } from '@/services/chart/index.js';

export const meta = {
	tags: ['charts', 'drive', 'users'],

	res: getJsonSchema(perUserDriveChart.schema),
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		span: { type: 'string', enum: ['day', 'hour'] },
		limit: { type: 'integer', minimum: 1, maximum: 500, default: 30 },
		offset: { type: 'integer', nullable: true, default: null },
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['span', 'userId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps) => {
	return await perUserDriveChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null, ps.userId);
});
