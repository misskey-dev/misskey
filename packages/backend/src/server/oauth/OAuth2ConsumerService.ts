/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { OAuth2 } from 'oauth';
import fetch from 'node-fetch';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import type { MiOAuth2ServersRepository, UsersRepository } from '@/models/_.js';
import type { MiLocalUser } from '@/models/User.js';
import { LoggerService } from '@/core/LoggerService.js';
import Logger from '@/logger.js';
import type { FastifyInstance, RequestGenericInterface } from 'fastify';

interface OAuth2AuthorizeRequest extends RequestGenericInterface {
	Params: {
		serverId: string;
	};
}

interface OAuth2CallbackRequest extends OAuth2AuthorizeRequest {
	Querystring: {
		code: string;
		state: string;
	};
}

@Injectable()
export class OAuth2ConsumerService {
	#logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,
		@Inject(DI.oauth2ServersRepository)
		private oauth2ServersRepository: MiOAuth2ServersRepository,
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
		loggerService: LoggerService,
	) {
		this.#logger = loggerService.getLogger('oauth');
	}

	@bindThis
	public async createServer(fastify: FastifyInstance): Promise<void> {
		fastify.get<OAuth2AuthorizeRequest>('/oauth/:serverId/authorize', async (request, reply) => {
			const oauth2Server = await this.oauth2ServersRepository.findOneBy({ id: request.params.serverId });

			if (oauth2Server == null) return reply.code(404).send({
				error: {
					message: 'No such oauth2 server.',
					code: 'NO_SUCH_OAUTH2_SERVER',
					id: 'ac8a48f4-a184-461d-b11f-e10448b3cd37',
					kind: 'client',
				},
			});

			if (oauth2Server.clientId == null || oauth2Server.clientSecret == null || oauth2Server.authorizeUrl == null || oauth2Server.tokenUrl == null) {
				return reply.code(500).send({
					error: {
						message: 'Invalid OAuth2 server configuration.',
						code: 'INVALID_OAUTH2_SERVER_CONFIGURATION',
						id: '0d6f9e6a-3e8e-4e3b-9d3c-4f4f4c4e4e4e',
						kind: 'client',
					},
				});
			}

			const oauth2 = new OAuth2(
				oauth2Server.clientId,
				oauth2Server.clientSecret,
				'',
				oauth2Server.authorizeUrl,
				oauth2Server.tokenUrl,
			);

			const authorizeUrl = oauth2.getAuthorizeUrl({
				redirect_uri: `${this.config.url}/oauth/${oauth2Server.id}/callback`,
				scope: oauth2Server.scope?.split(' '),
				response_type: 'code',
				state: 'state', // TODO: generate random string and store it in session
			});

			return reply.redirect(authorizeUrl);
		});
		fastify.get<OAuth2CallbackRequest>('/oauth/:serverId/callback', async (request, reply) => {
			const oauth2Server = await this.oauth2ServersRepository.findOneBy({ id: request.params.serverId });

			if (oauth2Server == null) return reply.code(404).send({
				error: {
					message: 'No such oauth2 server.',
					code: 'NO_SUCH_OAUTH2_SERVER',
					id: 'ac8a48f4-a184-461d-b11f-e10448b3cd37',
					kind: 'client',
				},
			});

			if (oauth2Server.clientId == null || oauth2Server.clientSecret == null || oauth2Server.authorizeUrl == null || oauth2Server.tokenUrl == null) {
				return reply.code(500).send({
					error: {
						message: 'Invalid OAuth2 server configuration.',
						code: 'INVALID_OAUTH2_SERVER_CONFIGURATION',
						id: '0d6f9e6a-3e8e-4e3b-9d3c-4f4f4c4e4e4e',
						kind: 'client',
					},
				});
			}

			const oauth2 = new OAuth2(
				oauth2Server.clientId,
				oauth2Server.clientSecret,
				'',
				oauth2Server.authorizeUrl,
				oauth2Server.tokenUrl,
			);

			const accessToken = await new Promise<string>((resolve, reject) => {
				return oauth2.getOAuthAccessToken(request.query.code, {
					grant_type: 'authorization_code',
					redirect_uri: `${this.config.url}/oauth/${oauth2Server.id}/callback`,
				}, (err, accessToken) => {
					if (err as unknown !== null) {
						return reject(err);
					} else {
						return resolve(accessToken);
					}
				});
			});

			const profile = await fetch(oauth2Server.profileUrl!, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			});

			return reply.send(await profile.json());
		});
	}
}
