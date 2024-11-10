/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject } from '@nestjs/common';
import ms from 'ms';
import RE2 from 're2';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { AbuseReportResolversRepository, MiAbuseReportResolver } from '@/models/_.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,
	kind: 'write:admin:abuse-report-resolvers',

	errors: {
		resolverNotFound: {
			message: 'Resolver not found.',
			id: 'fd32710e-75e1-4d20-bbd2-f89029acb16e',
			code: 'RESOLVER_NOT_FOUND',
		},
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
		resolverId: { type: 'string', format: 'misskey:id' },
		name: { type: 'string' },
		targetUserPattern: { type: 'string', nullable: true },
		reporterPattern: { type: 'string', nullable: true },
		reportContentPattern: { type: 'string', nullable: true },
		expiresAt: { type: 'string', enum: ['1hour', '12hours', '1day', '1week', '1month', '3months', '6months', '1year', 'indefinitely'] },
		forward: { type: 'boolean' },
	},
	required: ['resolverId'],
} as const;

@Injectable() // eslint-disable-next-line import/no-default-export
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.abuseReportResolversRepository)
		private abuseReportResolversRepository: AbuseReportResolversRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const properties: Partial<Omit<MiAbuseReportResolver, 'id'>> = {};
			const resolver = await this.abuseReportResolversRepository.findOneBy({
				id: ps.resolverId,
			});
			if (resolver === null) throw new ApiError(meta.errors.resolverNotFound);
			if (ps.name) properties.name = ps.name;
			if (ps.targetUserPattern) {
				try {
					new RE2(ps.targetUserPattern);
				} catch (e) {
					throw new ApiError(meta.errors.invalidRegularExpressionForTargetUser);
				}
				properties.targetUserPattern = ps.targetUserPattern;
			} else if (ps.targetUserPattern === null) {
				properties.targetUserPattern = null;
			}
			if (ps.reporterPattern) {
				try {
					new RE2(ps.reporterPattern);
				} catch (e) {
					throw new ApiError(meta.errors.invalidRegularExpressionForReporter);
				}
				properties.reporterPattern = ps.reporterPattern;
			} else if (ps.reporterPattern === null) {
				properties.reporterPattern = null;
			}
			if (ps.reportContentPattern) {
				try {
					new RE2(ps.reportContentPattern);
				} catch (e) {
					throw new ApiError(meta.errors.invalidRegularExpressionForReportContent);
				}
				properties.reportContentPattern = ps.reportContentPattern;
			} else if (ps.reportContentPattern === null) {
				properties.reportContentPattern = null;
			}
			if (ps.forward !== undefined) properties.forward = ps.forward;
			if (ps.expiresAt) {
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

				properties.expiresAt = ps.expiresAt;
				properties.expirationDate = expirationDate;
			}

			await this.abuseReportResolversRepository.update(ps.resolverId, {
				...properties,
				updatedAt: new Date(),
			});
		});
	}
}
