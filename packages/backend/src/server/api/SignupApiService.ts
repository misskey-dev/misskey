/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { IsNull } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { RegistrationTicketsRepository, UsedUsernamesRepository, UserPendingsRepository, UserProfilesRepository, UsersRepository, MiRegistrationTicket } from '@/models/_.js';
import type { Config } from '@/config.js';
import { MetaService } from '@/core/MetaService.js';
import { CaptchaService } from '@/core/CaptchaService.js';
import { IdService } from '@/core/IdService.js';
import { SignupService } from '@/core/SignupService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { EmailService } from '@/core/EmailService.js';
import { MiLocalUser } from '@/models/User.js';
import { FastifyReplyError } from '@/misc/fastify-reply-error.js';
import { bindThis } from '@/decorators.js';
import { L_CHARS, secureRndstr } from '@/misc/secure-rndstr.js';
import { LoggerService } from '@/core/LoggerService.js';
import { SigninService } from './SigninService.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'node:crypto';

@Injectable()
export class SignupApiService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.userPendingsRepository)
		private userPendingsRepository: UserPendingsRepository,

		@Inject(DI.usedUsernamesRepository)
		private usedUsernamesRepository: UsedUsernamesRepository,

		@Inject(DI.registrationTicketsRepository)
		private registrationTicketsRepository: RegistrationTicketsRepository,

		private loggerService: LoggerService,
		private userEntityService: UserEntityService,
		private idService: IdService,
		private metaService: MetaService,
		private captchaService: CaptchaService,
		private signupService: SignupService,
		private signinService: SigninService,
		private emailService: EmailService,
	) {
	}

	@bindThis
	public async signup(
		request: FastifyRequest<{
			Body: {
				username: string;
				password: string;
				host?: string;
				invitationCode?: string;
				emailAddress?: string;
				'hcaptcha-response'?: string;
				'g-recaptcha-response'?: string;
				'turnstile-response'?: string;
				'm-captcha-response'?: string;
			}
		}>,
		reply: FastifyReply,
	) {
		const logger = this.loggerService.getLogger('api:signup');
		logger.setContext({ username: request.body.username, email: request.body.emailAddress, ip: request.ip, headers: request.headers, span: request.headers['x-client-transaction-id'] ?? randomUUID() });
		logger.info('Requested to create user account.');

		const body = request.body;

		const instance = await this.metaService.fetch(true);

		// Verify *Captcha
		// ただしテスト時はこの機構は障害となるため無効にする
		if (process.env.NODE_ENV !== 'test') {
			if (instance.enableHcaptcha && instance.hcaptchaSecretKey) {
				await this.captchaService.verifyHcaptcha(instance.hcaptchaSecretKey, body['hcaptcha-response']).catch(err => {
					logger.error('Failed to verify hCaptcha.', { error: err });
					throw new FastifyReplyError(400, err);
				});
			}

			if (instance.enableMcaptcha && instance.mcaptchaSecretKey && instance.mcaptchaSitekey && instance.mcaptchaInstanceUrl) {
				await this.captchaService.verifyMcaptcha(instance.mcaptchaSecretKey, instance.mcaptchaSitekey, instance.mcaptchaInstanceUrl, body['m-captcha-response']).catch(err => {
					logger.error('Failed to verify mCaptcha.', { error: err });
					throw new FastifyReplyError(400, err);
				});
			}

			if (instance.enableRecaptcha && instance.recaptchaSecretKey) {
				await this.captchaService.verifyRecaptcha(instance.recaptchaSecretKey, body['g-recaptcha-response']).catch(err => {
					logger.error('Failed to verify reCAPTCHA.', { error: err });
					throw new FastifyReplyError(400, err);
				});
			}

			if (instance.enableTurnstile && instance.turnstileSecretKey) {
				await this.captchaService.verifyTurnstile(instance.turnstileSecretKey, body['turnstile-response']).catch(err => {
					logger.error('Failed to verify Turnstile.', { error: err });
					throw new FastifyReplyError(400, err);
				});
			}
		}

		const username = body['username'];
		const password = body['password'];
		const host: string | null = process.env.NODE_ENV === 'test' ? (body['host'] ?? null) : null;
		const invitationCode = body['invitationCode'];
		const emailAddress = body['emailAddress'];

		if (instance.emailRequiredForSignup) {
			if (emailAddress == null || typeof emailAddress !== 'string') {
				logger.error('Invalid request: email address is required.');
				reply.code(400);
				return;
			}

			const res = await this.emailService.validateEmailForAccount(emailAddress);
			if (!res.available) {
				logger.error('Failed to validate email address.', { reason: res.reason });
				reply.code(400);
				return;
			}
		}

		let ticket: MiRegistrationTicket | null = null;

		if (instance.disableRegistration) {
			if (invitationCode == null || typeof invitationCode !== 'string') {
				logger.error('Invalid request: invitation code is required.');
				reply.code(400);
				return;
			}

			ticket = await this.registrationTicketsRepository.findOneBy({
				code: invitationCode,
			});

			if (ticket == null || ticket.usedById != null) {
				logger.error('Invalid request: invalid invitation code.');
				reply.code(400);
				return;
			}

			if (ticket.expiresAt && ticket.expiresAt < new Date()) {
				logger.error('Invalid request: expired invitation code.');
				reply.code(400);
				return;
			}

			// メアド認証が有効の場合
			if (instance.emailRequiredForSignup) {
				// メアド認証済みならエラー
				if (ticket.usedBy) {
					logger.error('Invalid request: invitation code is already used.');
					reply.code(400);
					return;
				}

				// 認証しておらず、メール送信から30分以内ならエラー
				if (ticket.usedAt && ticket.usedAt.getTime() + (1000 * 60 * 30) > Date.now()) {
					logger.error('Invalid request: invitation code is already used.');
					reply.code(400);
					return;
				}
			} else if (ticket.usedAt) {
				logger.error('Invalid request: invitation code is already used.');
				reply.code(400);
				return;
			}
		}

		if (instance.emailRequiredForSignup) {
			if (await this.usersRepository.exists({ where: { usernameLower: username.toLowerCase(), host: IsNull() } })) {
				logger.error('Invalid request: username is already taken by another user.');
				throw new FastifyReplyError(400, 'DUPLICATED_USERNAME');
			}

			// Check deleted username duplication
			if (await this.usedUsernamesRepository.exists({ where: { username: username.toLowerCase() } })) {
				logger.error('Invalid request: username is already used.');
				throw new FastifyReplyError(400, 'USED_USERNAME');
			}

			const isPreserved = instance.preservedUsernames.map(x => x.toLowerCase()).includes(username.toLowerCase());
			if (isPreserved) {
				logger.error('Invalid request: username is preserved.');
				throw new FastifyReplyError(400, 'DENIED_USERNAME');
			}

			const code = secureRndstr(16, { chars: L_CHARS });

			// Generate hash of password
			const salt = await bcrypt.genSalt(8);
			const hash = await bcrypt.hash(password, salt);

			const pendingUser = await this.userPendingsRepository.insert({
				id: this.idService.gen(),
				code,
				email: emailAddress!,
				username: username,
				password: hash,
			}).then(x => this.userPendingsRepository.findOneByOrFail(x.identifiers[0]));

			const link = `${this.config.url}/signup-complete/${code}`;

			this.emailService.sendEmail(emailAddress!, 'Signup',
				`To complete signup, please click this link:<br><a href="${link}">${link}</a>`,
				`To complete signup, please click this link: ${link}`);

			if (ticket) {
				logger.info('Update invitation code as used by pending user.', { ticketId: ticket.id, pendingUserId: pendingUser.id, pendingUsername: pendingUser.username });
				await this.registrationTicketsRepository.update(ticket.id, {
					usedAt: new Date(),
					pendingUserId: pendingUser.id,
				});
			}

			logger.info('Successfully created pending user.', { pendingUserId: pendingUser.id });
			reply.code(204);
			return;
		} else {
			try {
				const { account, secret } = await this.signupService.signup({
					username, password, host,
				});

				const res = await this.userEntityService.pack(account, account, {
					schema: 'MeDetailed',
					includeSecrets: true,
				});

				if (ticket) {
					logger.info('Update invitation code as used by user.', { ticketId: ticket.id, userId: account.id, username });
					await this.registrationTicketsRepository.update(ticket.id, {
						usedAt: new Date(),
						usedBy: account,
						usedById: account.id,
					});
				}

				logger.info('Successfully created user.', { userId: account.id });
				return {
					...res,
					token: secret,
				};
			} catch (err) {
				logger.error('Failed to create user.', { error: err });
				throw new FastifyReplyError(400, typeof err === 'string' ? err : (err as Error).toString());
			}
		}
	}

	@bindThis
	public async signupPending(request: FastifyRequest<{ Body: { code: string; } }>, reply: FastifyReply) {
		const logger = this.loggerService.getLogger('api:signup:pending');
		logger.setContext({ code: request.body.code, ip: request.ip, headers: request.headers });
		logger.info('Requested to complete creating user account.');

		const body = request.body;

		const code = body['code'];

		try {
			const pendingUser = await this.userPendingsRepository.findOneByOrFail({ code });

			if (this.idService.parse(pendingUser.id).date.getTime() + (1000 * 60 * 30) < Date.now()) {
				logger.error('Invalid request: expired code.', { code });
				throw new FastifyReplyError(400, 'EXPIRED');
			}

			const { account, secret } = await this.signupService.signup({
				username: pendingUser.username,
				passwordHash: pendingUser.password,
			});

			this.userPendingsRepository.delete({
				id: pendingUser.id,
			});

			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: account.id });

			await this.userProfilesRepository.update({ userId: profile.userId }, {
				email: pendingUser.email,
				emailVerified: true,
				emailVerifyCode: null,
			});

			const ticket = await this.registrationTicketsRepository.findOneBy({ pendingUserId: pendingUser.id });
			if (ticket) {
				await this.registrationTicketsRepository.update(ticket.id, {
					usedBy: account,
					usedById: account.id,
					pendingUserId: null,
				});
			}

			logger.info('Successfully created user.', { userId: account.id });
			return this.signinService.signin(request, reply, account as MiLocalUser);
		} catch (err) {
			logger.error('Failed to complete creating user account.', { error: err });
			throw new FastifyReplyError(400, typeof err === 'string' ? err : (err as Error).toString());
		}
	}
}
