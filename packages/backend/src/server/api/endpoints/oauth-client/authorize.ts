/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { OAuth2 } from 'oauth';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { MiOAuth2ServersRepository } from '@/models/_.js';
import type { Config } from '@/config.js';
import { ApiError } from '../../error.js';

export const meta = {
	requireCredential: false,
	allowGet: true,

	tags: ['oauth2'],

	errors: {
		noSuchOAuth2Server: {
			message: 'No such oauth2 server.',
			code: 'NO_SUCH_OAUTH2_SERVER',
			id: 'ac8a48f4-a184-461d-b11f-e10448b3cd37',
		},
		invalidOAuth2ServerConfiguration: {
			message: 'Invalid OAuth2 server configuration.',
			code: 'INVALID_OAUTH2_SERVER_CONFIGURATION',
			id: 'change this',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			authorizeUrl: {
				type: 'string',
				optional: false, nullable: false,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		serverId: { type: 'string', format: 'misskey:id' },
	},
	required: ['serverId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.config)
		private config: Config,
		@Inject(DI.oauth2ServersRepository)
		private oauth2ServersRepository: MiOAuth2ServersRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const oauth2Server = await this.oauth2ServersRepository.findOneBy({ id: ps.serverId });

			if (oauth2Server === null) {
				throw new ApiError(meta.errors.noSuchOAuth2Server);
			}

			if (oauth2Server.clientId == null || oauth2Server.clientSecret == null || oauth2Server.authorizeUrl == null || oauth2Server.tokenUrl == null) {
				throw new ApiError(meta.errors.invalidOAuth2ServerConfiguration);
			}

			const oauth2 = new OAuth2(
				oauth2Server.clientId,
				oauth2Server.clientSecret,
				'',
				oauth2Server.authorizeUrl,
				oauth2Server.tokenUrl,
			);

			const authorizeUrl = oauth2.getAuthorizeUrl({
				redirect_uri: `${this.config.url}/oauth-client/callback/${oauth2Server.id}`,
				scope: oauth2Server.scope?.split(' '),
				response_type: 'code',
				state: 'state', // TODO: generate random string and store it in session
			});

			return {
				authorizeUrl: authorizeUrl,
			};
		});
	}
}
