/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { getResSchema } from '@/core/chart/core.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import PerUserPvChart from '@/core/chart/charts/per-user-pv.js';
import { schema } from '@/core/chart/charts/entities/per-user-pv.js';

export const meta = {
	tags: ['charts', 'users'],

	res: getResSchema(schema),

	allowGet: true,
	cacheSec: 60 * 60,
} as const;

export const paramDef = v.object({
	span: v.picklist(['day', 'hour']),
	limit: mi.limit({ max: 500, def: 30 }),
	offset: v.optional(v.nullable(mi.integer()), null),
	userId: mi.misskeyId(),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private perUserPvChart: PerUserPvChart,
	) {
		super(meta, paramDef, async (ps, me) => {
			return await this.perUserPvChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null, ps.userId);
		});
	}
}
