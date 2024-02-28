/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { OAuth2 } from 'oauth';
import fetch from 'node-fetch';
import { IsNull } from 'typeorm';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import type { MiOAuth2ServersRepository, MiUserIntegrationRepository, UserPendingsRepository, UserProfilesRepository, UsersRepository } from '@/models/_.js';
import type { MiLocalUser } from '@/models/User.js';
import { LoggerService } from '@/core/LoggerService.js';
import Logger from '@/logger.js';
import { MetaService } from '@/core/MetaService.js';
import { L_CHARS, secureRndstr } from '@/misc/secure-rndstr.js';
import { IdService } from '@/core/IdService.js';
import { EmailService } from '@/core/EmailService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { SignupService } from '@/core/SignupService.js';
import { SigninService } from '../api/SigninService.js';
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
		@Inject(DI.userIntegrationRepository)
		private userIntegrationRepository: MiUserIntegrationRepository,
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
		@Inject(DI.userPendingsRepository)
		private userPendingsRepository: UserPendingsRepository,
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,
		private userEntityService: UserEntityService,
		private metaService: MetaService,
		private idService: IdService,
		private emailService: EmailService,
		private signupService: SignupService,
		private signinService: SigninService,
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
						id: 'change this',
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
			if (!oauth2Server) {
				return reply.code(404).send({
					error: {
						message: 'No such oauth2 server.',
						code: 'NO_SUCH_OAUTH2_SERVER',
						id: 'ac8a48f4-a184-461d-b11f-e10448b3cd37',
						kind: 'client',
					},
				});
			}

			if (!oauth2Server.clientId || !oauth2Server.clientSecret || !oauth2Server.authorizeUrl || !oauth2Server.tokenUrl || !oauth2Server.profileUrl || !oauth2Server.idPath) {
				return reply.code(500).send({
					error: {
						message: 'Invalid OAuth2 server configuration.',
						code: 'INVALID_OAUTH2_SERVER_CONFIGURATION',
						id: 'change this',
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

			const profileResponse = await fetch(oauth2Server.profileUrl, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			});

			const profile: Record<string, string | null> = await profileResponse.json() as any;

			const serverUserId = profile[oauth2Server.idPath];
			if (serverUserId === null) {
				return reply.code(500).send({
					error: {
						message: 'Invalid OAuth2 server configuration.',
						code: 'INVALID_OAUTH2_SERVER_CONFIGURATION',
						id: 'change this',
						kind: 'client',
					},
				});
			}

			const userIntegration = await this.userIntegrationRepository.findOneBy({ serverUserId, serverId: oauth2Server.id });
			if (userIntegration) {
				return this.signinService.signin(request, reply, userIntegration.user as MiLocalUser);
			}

			if (!oauth2Server.allowSignUp) {
				return reply.code(401).send({
					error: {
						message: 'Not registered integration.',
						code: 'NO_SUCH_INTEGRATION',
						id: 'change this',
						kind: 'client',
					},
				});
			}

			if (!oauth2Server.usernamePath) {
				return reply.code(500).send({
					error: {
						message: 'Username Path is required for signin.',
						code: 'USERNAME_PATH_REQUIRED_FOR_SIGNIN',
						id: 'change this',
						kind: 'server',
					},
				});
			}

			const username = profile[oauth2Server.usernamePath];
			if (!username) {
				return reply.code(500).send({
					error: {
						message: 'Username is required for signin.',
						code: 'USERNAME_REQUIRED_FOR_SIGNIN',
						id: 'change this',
						kind: 'server',
					},
				});
			}

			const user = await this.usersRepository.findOneBy({ usernameLower: username.toLowerCase(), host: IsNull() }) as MiLocalUser | null;
			if (user !== null) {
				await this.userIntegrationRepository.insert({
					id: this.idService.gen(),
					userId: user.id,
					serverId: oauth2Server.id,
					serverUserId,
				});

				return this.signinService.signin(request, reply, user);
			}

			const instance = await this.metaService.fetch(true);
			if (!instance.emailRequiredForSignup) {
				const { account, secret } = await this.signupService.signup({
					username,
				});

				const res = await this.userEntityService.pack(account, account, {
					detail: true,
					includeSecrets: true,
				});

				return {
					...res,
					token: secret,
				};
			}

			if (!oauth2Server.emailPath) {
				return reply.code(500).send({
					error: {
						message: 'Email is required for signup.',
						code: 'EMAIL_REQUIRED_FOR_SIGNUP',
						id: 'change this',
						kind: 'server',
					},
				});
			}

			const email = profile[oauth2Server.emailPath];
			if (!email) {
				return reply.code(500).send({
					error: {
						message: 'Email is required for signup.',
						code: 'EMAIL_REQUIRED_FOR_SIGNUP',
						id: 'change this',
						kind: 'server',
					},
				});
			}

			if (oauth2Server.markEmailAsVerified) {
				const { account, secret } = await this.signupService.signup({
					username,
				});

				const profile = await this.userProfilesRepository.findOneByOrFail({ userId: account.id }); // is this correct?
				await this.userProfilesRepository.update({ userId: profile.userId }, {
					email,
					emailVerified: true,
					emailVerifyCode: null,
				});

				const res = await this.userEntityService.pack(account, account, {
					detail: true,
					includeSecrets: true,
				});

				return {
					...res,
					token: secret,
				};
			} else {
				const code = secureRndstr(16, { chars: L_CHARS });

				await this.userPendingsRepository.insert({
					id: this.idService.gen(),
					code,
					email,
					username,
				}).then(x => this.userPendingsRepository.findOneByOrFail(x.identifiers[0]));

				const link = `${this.config.url}/signup-complete/${code}`;

				this.emailService.sendEmail(email, 'Signup',
					`To complete signup, please click this link:<br><a href="${link}">${link}</a>`,
					`To complete signup, please click this link: ${link}`);

				return reply.code(204);
			}
		});
	}
}
