import { v4 as uuid } from 'uuid';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { AppsRepository, AuthSessionsRepository } from '@/models/index.js';
import { IdService } from '@/core/IdService.js';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['auth'],

	requireCredential: false,

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			token: {
				type: 'string',
				optional: false, nullable: false,
			},
			url: {
				type: 'string',
				optional: false, nullable: false,
				format: 'url',
			},
		},
	},

	errors: {
		noSuchApp: {
			message: 'No such app.',
			code: 'NO_SUCH_APP',
			id: '92f93e63-428e-4f2f-a5a4-39e1407fe998',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		appSecret: { type: 'string' },
	},
	required: ['appSecret'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.appsRepository)
		private appsRepository: AppsRepository,

		@Inject(DI.authSessionsRepository)
		private authSessionsRepository: AuthSessionsRepository,

		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Lookup app
			const app = await this.appsRepository.findOneBy({
				secret: ps.appSecret,
			});

			if (app == null) {
				throw new ApiError(meta.errors.noSuchApp);
			}

			// Generate token
			const token = uuid();

			// Create session token document
			const doc = await this.authSessionsRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				appId: app.id,
				token: token,
			}).then(x => this.authSessionsRepository.findOneByOrFail(x.identifiers[0]));

			return {
				token: doc.token,
				url: `${this.config.authUrl}/${doc.token}`,
			};
		});
	}
}
