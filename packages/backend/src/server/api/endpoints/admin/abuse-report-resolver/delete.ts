/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { AbuseReportResolversRepository } from '@/models/_.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,
	kind: 'write:admin:abuse-report-resolvers',

	errors: {
		resolverNotFound: {
			message: 'Resolver not found.',
			code: 'RESOLVER_NOT_FOUND',
			id: '121fbea9-3e49-4456-998a-d4095c7ac5c5',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		resolverId: { type: 'string', format: 'misskey:id' },
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
			const resolver = await this.abuseReportResolversRepository.findOneBy({
				id: ps.resolverId,
			});

			if (resolver === null) {
				throw new ApiError(meta.errors.resolverNotFound);
			}

			await this.abuseReportResolversRepository.delete(ps.resolverId);
		});
	}
}
