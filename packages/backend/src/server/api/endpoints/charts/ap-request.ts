import { Inject, Injectable } from '@nestjs/common';
import { getJsonSchema } from '@/core/chart/core.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import ApRequestChart from '@/core/chart/charts/ap-request.js';
import { schema } from '@/core/chart/charts/entities/ap-request.js';

export const meta = {
	tags: ['charts'],

	res: getJsonSchema(schema),

	allowGet: true,
	cacheSec: 60 * 60,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		span: { type: 'string', enum: ['day', 'hour'] },
		limit: { type: 'integer', minimum: 1, maximum: 500, default: 30 },
		offset: { type: 'integer', nullable: true, default: null },
	},
	required: ['span'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		private apRequestChart: ApRequestChart,
	) {
		super(meta, paramDef, async (ps, me) => {
			return await this.apRequestChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null);
		});
	}
}
