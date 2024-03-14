import * as jose from 'jose';
import { Inject, Injectable } from '@nestjs/common';
import type { SingleSignOnServiceProviderRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:sso',

	errors: {
		noSuchSingleSignOnServiceProvider: {
			message: 'No such SSO Service Provider',
			code: 'NO_SUCH_SSO_SP',
			id: '2f481db0-23f5-4380-8cb8-704169ffb25b',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		id: { type: 'string' },
		name: { type: 'string' },
		issuer: { type: 'string' },
		audience: { type: 'array', items: { type: 'string', nullable: false } },
		acsUrl: { type: 'string' },
		signatureAlgorithm: { type: 'string' },
		cipherAlgorithm: { type: 'string' },
		wantAuthnRequestsSigned: { type: 'boolean' },
		wantAssertionsSigned: { type: 'boolean' },
		regenerateCertificate: { type: 'boolean' },
		secret: { type: 'string' },
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

			const alg = ps.signatureAlgorithm ? ps.signatureAlgorithm : service.signatureAlgorithm;
			const { publicKey, privateKey } = ps.regenerateCertificate
				? await jose.generateKeyPair(alg).then(async keypair => ({
					publicKey: JSON.stringify(await jose.exportJWK(keypair.publicKey)),
					privateKey: JSON.stringify(await jose.exportJWK(keypair.privateKey)),
				}))
				: { publicKey: ps.secret ?? undefined, privateKey: undefined };

			await this.singleSignOnServiceProviderRepository.update(service.id, {
				name: ps.name !== '' ? ps.name : null,
				issuer: ps.issuer,
				audience: ps.audience,
				acsUrl: ps.acsUrl,
				publicKey: publicKey,
				privateKey: privateKey,
				signatureAlgorithm: ps.signatureAlgorithm,
				cipherAlgorithm: ps.cipherAlgorithm !== '' ? ps.cipherAlgorithm : null,
				wantAuthnRequestsSigned: ps.wantAuthnRequestsSigned,
				wantAssertionsSigned: ps.wantAssertionsSigned,
			});

			const updatedService = await this.singleSignOnServiceProviderRepository.findOneByOrFail({ id: service.id });

			this.moderationLogService.log(me, 'updateSSOServiceProvider', {
				serviceId: service.id,
				before: service,
				after: updatedService,
			});
		});
	}
}
