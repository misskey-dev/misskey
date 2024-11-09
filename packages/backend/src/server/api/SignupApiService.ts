/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { IsNull } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { RegistrationTicketsRepository, UsedUsernamesRepository, UserPendingsRepository, UserProfilesRepository, UsersRepository, MiRegistrationTicket, MiMeta } from '@/models/_.js';
import type { Config } from '@/config.js';
import { CaptchaService } from '@/core/CaptchaService.js';
import { IdService } from '@/core/IdService.js';
import { SignupService } from '@/core/SignupService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { EmailService } from '@/core/EmailService.js';
import { MiLocalUser } from '@/models/User.js';
import { FastifyReplyError } from '@/misc/fastify-reply-error.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { bindThis } from '@/decorators.js';
import { L_CHARS, secureRndstr } from '@/misc/secure-rndstr.js';
import { SigninService } from './SigninService.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

@Injectable()
export class SignupApiService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.meta)
		private meta: MiMeta,

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

		private userEntityService: UserEntityService,
		private idService: IdService,
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
				'testcaptcha-response'?: string;
			}
		}>,
		reply: FastifyReply,
	) {
		const body = request.body;

		function error(status: number, error: { id: string, [x: string]: string }) {
			reply.code(status);
			return { error };
		}

		// Verify *Captcha
		// ただしテスト時はこの機構は障害となるため無効にする
		if (process.env.NODE_ENV !== 'test') {
			if (this.meta.enableHcaptcha && this.meta.hcaptchaSecretKey) {
				await this.captchaService.verifyHcaptcha(this.meta.hcaptchaSecretKey, body['hcaptcha-response']).catch(err => {
					throw new FastifyReplyError(400, err);
				});
			}

			if (this.meta.enableMcaptcha && this.meta.mcaptchaSecretKey && this.meta.mcaptchaSitekey && this.meta.mcaptchaInstanceUrl) {
				await this.captchaService.verifyMcaptcha(this.meta.mcaptchaSecretKey, this.meta.mcaptchaSitekey, this.meta.mcaptchaInstanceUrl, body['m-captcha-response']).catch(err => {
					throw new FastifyReplyError(400, err);
				});
			}

			if (this.meta.enableRecaptcha && this.meta.recaptchaSecretKey) {
				await this.captchaService.verifyRecaptcha(this.meta.recaptchaSecretKey, body['g-recaptcha-response']).catch(err => {
					throw new FastifyReplyError(400, err);
				});
			}

			if (this.meta.enableTurnstile && this.meta.turnstileSecretKey) {
				await this.captchaService.verifyTurnstile(this.meta.turnstileSecretKey, body['turnstile-response']).catch(err => {
					throw new FastifyReplyError(400, err);
				});
			}

			if (this.meta.enableTestcaptcha) {
				await this.captchaService.verifyTestcaptcha(body['testcaptcha-response']).catch(err => {
					throw new FastifyReplyError(400, err);
				});
			}
		}

		const username = body['username'];
		const password = body['password'];
		const host: string | null = process.env.NODE_ENV === 'test' ? (body['host'] ?? null) : null;
		const invitationCode = body['invitationCode'];
		const emailAddress = body['emailAddress'];

		if (this.meta.emailRequiredForSignup) {
			if (emailAddress == null || typeof emailAddress !== 'string' || emailAddress === '') {
				return error(400, {
					id: '33b104c9-2f22-4640-b27a-40979bde4a77',
					message: 'Email address is not present or is invalid.',
				});
			}

			const res = await this.emailService.validateEmailForAccount(emailAddress);
			if (!res.available) {
				return error(400, {
					id: '75ece55a-7869-49b1-b796-c0634224fcae',
					message: 'You cannot use this email address.',
				});
			}
		}

		let ticket: MiRegistrationTicket | null = null;

		if (this.meta.disableRegistration) {
			if (invitationCode == null || typeof invitationCode !== 'string' || invitationCode === '') {
				return error(400, {
					id: 'c8324ccf-7153-47a0-90a3-682eb06ba10d',
					message: 'Invitation code is not present or is invalid.',
				});
			}

			ticket = await this.registrationTicketsRepository.findOneBy({
				code: invitationCode,
			});

			if (ticket == null || ticket.usedById != null) {
				return error(400, {
					id: 'f08118af-8358-441c-b992-b5b0bbd337d2',
					message: 'Invitation code not found or already used.',
				});
			}

			if (ticket.expiresAt && ticket.expiresAt < new Date()) {
				return error(400, {
					id: '3277822c-29dd-4bc9-ad57-47af702f78b8',
					message: 'Invitation code has expired.',
				});
			}

			// メアド認証が有効の場合
			if (this.meta.emailRequiredForSignup) {
				// メアド認証済みならエラー
				if (ticket.usedBy) {
					return error(400, {
						id: 'f08118af-8358-441c-b992-b5b0bbd337d2',
						message: 'Invitation code not found or already used.',
					});
				}

				// 認証しておらず、メール送信から30分以内ならエラー
				if (ticket.usedAt && ticket.usedAt.getTime() + (1000 * 60 * 30) > Date.now()) {
					return error(400, {
						id: 'f08118af-8358-441c-b992-b5b0bbd337d2',
						message: 'Invitation code not found or already used.',
					});
				}
			} else if (ticket.usedAt) {
				return error(400, {
					id: 'f08118af-8358-441c-b992-b5b0bbd337d2',
					message: 'Invitation code not found or already used.',
				});
			}
		}

		if (this.meta.emailRequiredForSignup) {
			if (await this.usersRepository.exists({ where: { usernameLower: username.toLowerCase(), host: IsNull() } })) {
				return error(400, {
					id: '9c20a0c3-c9e7-418f-8058-767f4e345bd4',
					code: 'DUPLICATED_USERNAME',
					message: 'Username already exists.',
				});
			}

			// Check deleted username duplication
			if (await this.usedUsernamesRepository.exists({ where: { username: username.toLowerCase() } })) {
				return error(400, {
					id: '90e84f35-599a-468c-b420-98139fe9f988',
					code: 'USED_USERNAME',
					message: 'Username was previously used by another user.',
				});
			}

			const isPreserved = this.meta.preservedUsernames.map(x => x.toLowerCase()).includes(username.toLowerCase());
			if (isPreserved) {
				return error(400, {
					id: 'e26cbcc3-7a0c-4cf4-988f-533f56ca72bf',
					code: 'DENIED_USERNAME',
					message: 'This username is not allowed.',
				});
			}

			const code = secureRndstr(16, { chars: L_CHARS });

			// Generate hash of password
			const salt = await bcrypt.genSalt(8);
			const hash = await bcrypt.hash(password, salt);

			const pendingUser = await this.userPendingsRepository.insertOne({
				id: this.idService.gen(),
				code,
				email: emailAddress!,
				username: username,
				password: hash,
			});

			const link = `${this.config.url}/signup-complete/${code}`;

			this.emailService.sendEmail(emailAddress!, 'Signup',
				`To complete signup, please click this link:<br><a href="${link}">${link}</a>`,
				`To complete signup, please click this link: ${link}`);

			if (ticket) {
				await this.registrationTicketsRepository.update(ticket.id, {
					usedAt: new Date(),
					pendingUserId: pendingUser.id,
				});
			}

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
					await this.registrationTicketsRepository.update(ticket.id, {
						usedAt: new Date(),
						usedBy: account,
						usedById: account.id,
					});
				}

				return {
					...res,
					token: secret,
				};
			} catch (err) {
				if (err instanceof IdentifiableError) {
					switch (err.id) {
						case 'be85f7f4-1dd3-4107-bce4-07cdb0cbb0c3':
							return error(400, {
								id: 'f6bff66c-a3f9-48b8-b56c-3c3ffc49bfdd',
								code: 'INVALID_USERNAME',
								message: 'Username is invalid.',
							});
						case 'd5f4959c-a881-41e8-b755-718fbf161258':
							return error(400, {
								id: '6dffa54e-9f5f-4c07-9662-e5c75ab63ee5',
								code: 'INVALID_PASSWORD',
								message: 'Password is invalid.',
							});
						case 'd412327a-1bd7-4b70-a982-7eec000db8fc':
							return error(400, {
								id: '9c20a0c3-c9e7-418f-8058-767f4e345bd4',
								code: 'DUPLICATED_USERNAME',
								message: 'Username already exists.',
							});
						case 'dd5f52be-2c95-4c39-ba45-dc2d74b3dd81':
							return error(400, {
								id: '90e84f35-599a-468c-b420-98139fe9f988',
								code: 'USED_USERNAME',
								message: 'Username was previously used by another user.',
							});
						case 'adad138b-9c63-41bf-931e-6b050fd3bb8d':
							return error(400, {
								id: 'e26cbcc3-7a0c-4cf4-988f-533f56ca72bf',
								code: 'DENIED_USERNAME',
								message: 'This username is not allowed.',
							});
					}
				}

				throw new FastifyReplyError(400, typeof err === 'string' ? err : (err as Error).toString());
			}
		}
	}

	@bindThis
	public async signupPending(request: FastifyRequest<{ Body: { code: string; } }>, reply: FastifyReply) {
		const body = request.body;

		const code = body['code'];

		function error(status: number, error: { id: string, [x: string]: string }) {
			reply.code(status);
			return { error };
		}

		try {
			const pendingUser = await this.userPendingsRepository.findOneByOrFail({ code });

			if (this.idService.parse(pendingUser.id).date.getTime() + (1000 * 60 * 30) < Date.now()) {
				return error(400, {
					id: 'e8b5b1ce-c7fe-456f-b06b-467cd16c060f',
					code: 'EXPIRED',
					message: 'This link has expired.',
				});
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

			return this.signinService.signin(request, reply, account as MiLocalUser);
		} catch (err) {
			throw new FastifyReplyError(400, typeof err === 'string' ? err : (err as Error).toString());
		}
	}
}
