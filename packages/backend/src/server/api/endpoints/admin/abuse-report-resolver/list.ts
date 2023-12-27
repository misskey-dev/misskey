/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject } from '@nestjs/common';
import { Brackets } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { QueryService } from '@/core/QueryService.js';
import type { AbuseReportResolversRepository } from '@/models/_.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,
	kind: 'read:admin:abuse-report-resolvers',

	res: {
		type: 'array',
		items: {
			type: 'object',
			properties: {
				name: {
					type: 'string',
					nullable: false, optional: false,
				},
				targetUserPattern: {
					type: 'string',
					nullable: true, optional: false,
				},
				reporterPattern: {
					type: 'string',
					nullable: true, optional: false,
				},
				reportContentPattern: {
					type: 'string',
					nullable: true, optional: false,
				},
				expiresAt: {
					type: 'string',
					nullable: false, optional: false,
				},
				forward: {
					type: 'boolean',
					nullable: false, optional: false,
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'number', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
	},
	required: [],
} as const;

@Injectable() // eslint-disable-next-line import/no-default-export
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.abuseReportResolversRepository)
		private abuseReportResolversRepository: AbuseReportResolversRepository,

		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.abuseReportResolversRepository.createQueryBuilder('abuseReportResolvers'), ps.sinceId, ps.untilId)
				.andWhere(new Brackets(qb => {
					qb.where('abuseReportResolvers.expirationDate > :date', { date: new Date() });
					qb.orWhere('abuseReportResolvers.expirationDate IS NULL');
				}))
				.take(ps.limit);

			return await query.getMany();
		});
	}
}

