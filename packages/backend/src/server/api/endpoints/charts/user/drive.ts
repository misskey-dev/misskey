/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { getResSchema } from '@/core/chart/core.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import PerUserDriveChart from '@/core/chart/charts/per-user-drive.js';
import { schema } from '@/core/chart/charts/entities/per-user-drive.js';

export const meta = {
	tags: ['charts', 'drive', 'users'],

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
		private perUserDriveChart: PerUserDriveChart,
	) {
		super(meta, paramDef, async (ps, me) => {
			return await this.perUserDriveChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null, ps.userId);
		});
	}
}
