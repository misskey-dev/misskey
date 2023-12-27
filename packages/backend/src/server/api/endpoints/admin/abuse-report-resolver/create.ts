/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject } from '@nestjs/common';
import ms from 'ms';
import RE2 from 're2';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';
import type { AbuseReportResolversRepository } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,
	kind: 'write:admin:abuse-report-resolvers',

	res: {
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

	errors: {
		invalidRegularExpressionForTargetUser: {
			message: 'Invalid regular expression for target user.',
			code: 'INVALID_REGULAR_EXPRESSION_FOR_TARGET_USER',
			id: 'c008484a-0a14-4e74-86f4-b176dc49fcaa',
		},
		invalidRegularExpressionForReporter: {
			message: 'Invalid regular expression for reporter.',
			code: 'INVALID_REGULAR_EXPRESSION_FOR_REPORTER',
			id: '399b4062-257f-44c8-87cc-4ffae2527fbc',
		},
		invalidRegularExpressionForReportContent: {
			message: 'Invalid regular expression for report content.',
			code: 'INVALID_REGULAR_EXPRESSION_FOR_REPORT_CONTENT',
			id: '88c124d8-f517-4c63-a464-0abc274168b',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string', minLength: 1 },
		targetUserPattern: { type: 'string', nullable: true },
		reporterPattern: { type: 'string', nullable: true },
		reportContentPattern: { type: 'string', nullable: true },
		expiresAt: { type: 'string', enum: ['1hour', '12hours', '1day', '1week', '1month', '3months', '6months', '1year', 'indefinitely'] },
		forward: { type: 'boolean' },
	},
	required: ['name', 'targetUserPattern', 'reporterPattern', 'reportContentPattern', 'expiresAt', 'forward'],
} as const;

@Injectable() // eslint-disable-next-line import/no-default-export
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.abuseReportResolversRepository)
		private abuseReportResolverRepository: AbuseReportResolversRepository,

		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			if (ps.targetUserPattern) {
				try {
					new RE2(ps.targetUserPattern);
				} catch (e) {
					throw new ApiError(meta.errors.invalidRegularExpressionForTargetUser);
				}
			}
			if (ps.reporterPattern) {
				try {
					new RE2(ps.reporterPattern);
				} catch (e) {
					throw new ApiError(meta.errors.invalidRegularExpressionForReporter);
				}
			}
			if (ps.reportContentPattern) {
				try {
					new RE2(ps.reportContentPattern);
				} catch (e) {
					throw new ApiError(meta.errors.invalidRegularExpressionForReportContent);
				}
			}
			const now = new Date();
			let expirationDate: Date | null = new Date();
			const previousMonth = expirationDate.getUTCMonth();
			(ps.expiresAt === '1hour' ? function () { expirationDate!.setTime(expirationDate!.getTime() + ms('1 hour')); } :
				ps.expiresAt === '12hours' ? function () { expirationDate!.setTime(expirationDate!.getTime() + ms('12 hours')); } :
				ps.expiresAt === '1day' ? function () { expirationDate!.setTime(expirationDate!.getTime() + ms('1 day')); } :
				ps.expiresAt === '1week' ? function () { expirationDate!.setTime(expirationDate!.getTime() + ms('1 week')); } :
				ps.expiresAt === '1month' ? function () { expirationDate!.setUTCMonth((expirationDate!.getUTCMonth() + 1 + 1) % 12 - 1); expirationDate!.setUTCFullYear(expirationDate!.getUTCFullYear() + (Math.floor((previousMonth + 1 + 1) / 12))); } :
				ps.expiresAt === '3months' ? function () {expirationDate!.setUTCMonth((expirationDate!.getUTCMonth() + 3 + 1) % 12 - 1); expirationDate!.setUTCFullYear(expirationDate!.getUTCFullYear() + (Math.floor((previousMonth + 3 + 1) / 12))); } :
				ps.expiresAt === '6months' ? function () { expirationDate!.setUTCMonth((expirationDate!.getUTCMonth() + 6 + 1) % 12 - 1); expirationDate!.setUTCFullYear(expirationDate!.getUTCFullYear() + (Math.floor((previousMonth + 6 + 1) / 12))); } :
				ps.expiresAt === '1year' ? function () { expirationDate!.setUTCFullYear(expirationDate!.getUTCFullYear() + 1); } : function () { expirationDate = null; })();

			return await this.abuseReportResolverRepository.insert({
				id: this.idService.gen(now.getTime()),
				createdAt: now,
				updatedAt: now,
				name: ps.name,
				targetUserPattern: ps.targetUserPattern,
				reporterPattern: ps.reporterPattern,
				reportContentPattern: ps.reportContentPattern,
				expirationDate,
				expiresAt: ps.expiresAt,
				forward: ps.forward,
			}).then(x => this.abuseReportResolverRepository.findOneByOrFail(x.identifiers[0]));
		});
	}
}

