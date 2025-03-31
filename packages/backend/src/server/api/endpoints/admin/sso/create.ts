import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import * as jose from 'jose';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { SingleSignOnServiceProviderRepository } from '@/models/_.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { genX509CertFromJWK } from '@/misc/gen-x509-cert-from-jwk.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,
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
			binding: {
				type: 'string',
				optional: false, nullable: false,
				enum: ['post', 'redirect'],
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
		binding: { type: 'string', enum: ['post', 'redirect'], nullable: false },
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
		@Inject(DI.config)
		private config: Config,
		@Inject(DI.singleSignOnServiceProviderRepository)
		private singleSignOnServiceProviderRepository: SingleSignOnServiceProviderRepository,

		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			if (ps.type === 'saml' && ps.useCertificate === false) {
				throw new ApiError(meta.errors.invalidParamSamlUseCertificate);
			}

			const { publicKey, privateKey } = ps.useCertificate
				? await jose.generateKeyPair(ps.signatureAlgorithm, { extractable: true }).then(async keypair => ({
					publicKey: JSON.stringify(await jose.exportJWK(keypair.publicKey)),
					privateKey: JSON.stringify(await jose.exportJWK(keypair.privateKey)),
				}))
				: { publicKey: ps.secret ?? randomUUID(), privateKey: null };

			const now = new Date();
			const tenYearsLaterTime = new Date(now.getTime());
			tenYearsLaterTime.setFullYear(tenYearsLaterTime.getFullYear() + 10);

			const x509Cert = ps.type === 'saml' && ps.useCertificate ? await genX509CertFromJWK(
				this.config.hostname,
				now,
				tenYearsLaterTime,
				publicKey,
				privateKey ?? '',
				ps.signatureAlgorithm,
			) : undefined;

			const ssoServiceProvider = await this.singleSignOnServiceProviderRepository.insert({
				id: randomUUID(),
				createdAt: now,
				name: ps.name ? ps.name : null,
				type: ps.type,
				issuer: ps.issuer,
				audience: ps.audience?.filter(i => i.length > 0) ?? [],
				binding: ps.binding,
				acsUrl: ps.acsUrl,
				publicKey: ps.type === 'saml' && ps.useCertificate ? x509Cert : publicKey,
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
				binding: ssoServiceProvider.binding,
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
