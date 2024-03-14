import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import * as jose from 'jose';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { DI } from '@/di-symbols.js';
import type { SingleSignOnServiceProviderRepository } from '@/models/_.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:sso',

	errors: {
		invalidParamSamlUseCertificate: {
			message: 'SAML service provider must use certificate.',
			code: 'INVALID_PARAM',
			id: 'bb97e559-f23c-4d6a-9e4e-eb5db1f467f9',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			id: {
				type: 'string',
				optional: false, nullable: false,
			},
			createdAt: {
				type: 'string',
				optional: false, nullable: false,
				format: 'date-time',
			},
			name: {
				type: 'string',
				optional: false, nullable: true,
			},
			type: {
				type: 'string',
				optional: false, nullable: false,
				enum: ['saml', 'jwt'],
			},
			issuer: {
				type: 'string',
				optional: false, nullable: false,
			},
			audience: {
				type: 'array',
				optional: false, nullable: false,
				items: { type: 'string', nullable: false },
			},
			acsUrl: {
				type: 'string',
				optional: false, nullable: false,
			},
			publicKey: {
				type: 'string',
				optional: false, nullable: false,
			},
			signatureAlgorithm: {
				type: 'string',
				optional: false, nullable: false,
			},
			cipherAlgorithm: {
				type: 'string',
				optional: true, nullable: true,
			},
			wantAuthnRequestsSigned: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			wantAssertionsSigned: {
				type: 'boolean',
				optional: false, nullable: false,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string', nullable: true },
		type: { type: 'string', enum: ['saml', 'jwt'], nullable: false },
		issuer: { type: 'string', nullable: false },
		audience: { type: 'array', items: { type: 'string', nullable: false }, default: [] },
		acsUrl: { type: 'string', nullable: false },
		signatureAlgorithm: { type: 'string', nullable: false },
		cipherAlgorithm: { type: 'string', nullable: true },
		wantAuthnRequestsSigned: { type: 'boolean', nullable: false, default: false },
		wantAssertionsSigned: { type: 'boolean', nullable: false, default: true },
		useCertificate: { type: 'boolean', nullable: false, default: true },
		secret: { type: 'string', nullable: true },
	},
	required: ['type', 'issuer', 'acsUrl', 'signatureAlgorithm', 'useCertificate'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.singleSignOnServiceProviderRepository)
		private singleSignOnServiceProviderRepository: SingleSignOnServiceProviderRepository,

		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			if (ps.type === 'saml' && ps.useCertificate === false) {
				throw new ApiError(meta.errors.invalidParamSamlUseCertificate);
			}

			const { publicKey, privateKey } = ps.useCertificate
				? await jose.generateKeyPair(ps.signatureAlgorithm).then(async keypair => ({
					publicKey: JSON.stringify(await jose.exportJWK(keypair.publicKey)),
					privateKey: JSON.stringify(await jose.exportJWK(keypair.privateKey)),
				}))
				: { publicKey: ps.secret ?? randomUUID(), privateKey: null };

			const ssoServiceProvider = await this.singleSignOnServiceProviderRepository.insert({
				id: randomUUID(),
				createdAt: new Date(),
				name: ps.name ? ps.name : null,
				type: ps.type,
				issuer: ps.issuer,
				audience: ps.audience,
				acsUrl: ps.acsUrl,
				publicKey: publicKey,
				privateKey: privateKey,
				signatureAlgorithm: ps.signatureAlgorithm,
				cipherAlgorithm: ps.cipherAlgorithm ? ps.cipherAlgorithm : null,
				wantAuthnRequestsSigned: ps.wantAuthnRequestsSigned,
				wantAssertionsSigned: ps.wantAssertionsSigned,
			}).then(r => this.singleSignOnServiceProviderRepository.findOneByOrFail({ id: r.identifiers[0].id }));

			this.moderationLogService.log(me, 'createSSOServiceProvider', {
				serviceId: ssoServiceProvider.id,
				service: ssoServiceProvider,
			});

			return {
				id: ssoServiceProvider.id,
				createdAt: ssoServiceProvider.createdAt.toISOString(),
				name: ssoServiceProvider.name,
				type: ssoServiceProvider.type,
				issuer: ssoServiceProvider.issuer,
				audience: ssoServiceProvider.audience,
				acsUrl: ssoServiceProvider.acsUrl,
				publicKey: ssoServiceProvider.publicKey,
				signatureAlgorithm: ssoServiceProvider.signatureAlgorithm,
				cipherAlgorithm: ssoServiceProvider.cipherAlgorithm,
				wantAuthnRequestsSigned: ssoServiceProvider.wantAuthnRequestsSigned,
				wantAssertionsSigned: ssoServiceProvider.wantAssertionsSigned,
			};
		});
	}
}
