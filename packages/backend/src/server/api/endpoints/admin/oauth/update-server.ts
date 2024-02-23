/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { MiOAuth2ServersRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,

	errors: {
		noSuchOAuth2Server: {
			message: 'No such oauth2 server.',
			code: 'NO_SUCH_OAUTH2_SERVER',
			id: '43def71b-c78e-4249-a8f4-4bdb3c4d96b3',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		id: { type: 'string', format: 'misskey:id' },
		title: { type: 'string' },
		description: { type: 'string' },
		clientId: { type: 'string' },
		clientSecret: { type: 'string' },
		authorizeUrl: { type: 'string' },
		tokenUrl: { type: 'string' },
		signUpUrl: { type: 'string' },
		scope: { type: 'string' },
		profileUrl: { type: 'string' },
		idPath: { type: 'string' },
		namePath: { type: 'string' },
		emailPath: { type: 'string' },
		markEmailAsVerified: { type: 'boolean' },
		usernamePath: { type: 'string' },
		allowSignUp: { type: 'boolean' },
	},
	required: ['id', 'title'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.oauth2ServersRepository)
		private oauth2ServersRepository: MiOAuth2ServersRepository,

		private idService: IdService,
		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const oauth2Server = await this.oauth2ServersRepository.findOneBy({ id: ps.id });

			if (oauth2Server == null) throw new ApiError(meta.errors.noSuchOAuth2Server);

			await this.oauth2ServersRepository.update(ps.id, {
				updatedAt: new Date(),
				title: ps.title,
				description: ps.description,
				clientId: ps.clientId,
				clientSecret: ps.clientSecret,
				authorizeUrl: ps.authorizeUrl,
				tokenUrl: ps.tokenUrl,
				signUpUrl: ps.signUpUrl,
				scope: ps.scope,
				profileUrl: ps.profileUrl,
				namePath: ps.namePath,
				emailPath: ps.emailPath,
				markEmailAsVerified: ps.markEmailAsVerified,
				usernamePath: ps.usernamePath,
				idPath: ps.idPath,
				allowSignUp: ps.allowSignUp,
			});

			const updatedOAuth2Server = this.oauth2ServersRepository.findOneByOrFail({ id: ps.id });

			this.moderationLogService.log(me, 'updateOAuth2Server', {
				oauth2ServerId: ps.id,
				before: oauth2Server,
				after: updatedOAuth2Server,
			});

			return updatedOAuth2Server;
		});
	}
}
