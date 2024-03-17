import { Inject, Injectable } from '@nestjs/common';
import type { SingleSignOnServiceProviderRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,
	kind: 'write:admin:sso',

	errors: {
		noSuchSingleSignOnServiceProvider: {
			message: 'No such SSO Service Provider',
			code: 'NO_SUCH_SSO_SP',
			id: 'ece541d3-6c41-4fc3-a514-fa762b96704a',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		id: { type: 'string' },
	},
	required: ['id'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.singleSignOnServiceProviderRepository)
		private singleSignOnServiceProviderRepository: SingleSignOnServiceProviderRepository,

		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const service = await this.singleSignOnServiceProviderRepository.findOneBy({ id: ps.id });

			if (service == null) throw new ApiError(meta.errors.noSuchSingleSignOnServiceProvider);

			await this.singleSignOnServiceProviderRepository.delete(service.id);

			this.moderationLogService.log(me, 'deleteSSOServiceProvider', {
				serviceId: service.id,
				service: service,
			});
		});
	}
}
