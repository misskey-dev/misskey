import { Inject, Injectable } from '@nestjs/common';
import type { SingleSignOnServiceProviderRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { Endpoint } from '@/server/api/endpoint-base.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:sso',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
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
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		offset: { type: 'integer', default: 0 },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.singleSignOnServiceProviderRepository)
		private singleSignOnServiceProviderRepository: SingleSignOnServiceProviderRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.singleSignOnServiceProviderRepository.createQueryBuilder('service');
			const services = await query.offset(ps.offset).limit(ps.limit).getMany();

			return services.map(service => ({
				id: service.id,
				createdAt: service.createdAt.toISOString(),
				name: service.name,
				type: service.type,
				issuer: service.issuer,
				audience: service.audience,
				acsUrl: service.acsUrl,
				publicKey: service.publicKey,
				signatureAlgorithm: service.signatureAlgorithm,
				cipherAlgorithm: service.cipherAlgorithm,
				wantAuthnRequestsSigned: service.wantAuthnRequestsSigned,
				wantAssertionsSigned: service.wantAssertionsSigned,
			}));
		});
	}
}
