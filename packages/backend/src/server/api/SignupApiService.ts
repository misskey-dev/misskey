import { Inject, Injectable } from '@nestjs/common';
import rndstr from 'rndstr';
import bcrypt from 'bcryptjs';
import { DI } from '@/di-symbols.js';
import type { RegistrationTicketsRepository, UserPendingsRepository, UserProfilesRepository, UsersRepository } from '@/models/index.js';
import type { Config } from '@/config.js';
import { MetaService } from '@/core/MetaService.js';
import { CaptchaService } from '@/core/CaptchaService.js';
import { IdService } from '@/core/IdService.js';
import { SignupService } from '@/core/SignupService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { EmailService } from '@/core/EmailService.js';
import { ILocalUser } from '@/models/entities/User.js';
import { SigninService } from './SigninService.js';
import type Koa from 'koa';

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

		@Inject(DI.registrationTicketsRepository)
		private registrationTicketsRepository: RegistrationTicketsRepository,

		private userEntityService: UserEntityService,
		private idService: IdService,
		private metaService: MetaService,
		private captchaService: CaptchaService,
		private signupService: SignupService,
		private signinService: SigninService,
		private emailService: EmailService,
	) {
	}

	public async signup(ctx: Koa.Context) {
		const body = ctx.request.body;

		const instance = await this.metaService.fetch(true);
	
		// Verify *Captcha
		// ただしテスト時はこの機構は障害となるため無効にする
		if (process.env.NODE_ENV !== 'test') {
			if (instance.enableHcaptcha && instance.hcaptchaSecretKey) {
				await this.captchaService.verifyHcaptcha(instance.hcaptchaSecretKey, body['hcaptcha-response']).catch(e => {
					ctx.throw(400, e);
				});
			}
	
			if (instance.enableRecaptcha && instance.recaptchaSecretKey) {
				await this.captchaService.verifyRecaptcha(instance.recaptchaSecretKey, body['g-recaptcha-response']).catch(e => {
					ctx.throw(400, e);
				});
			}

			if (instance.enableTurnstile && instance.turnstileSecretKey) {
				await this.captchaService.verifyTurnstile(instance.turnstileSecretKey, body['turnstile-response']).catch(e => {
					ctx.throw(400, e);
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
				ctx.status = 400;
				return;
			}
	
			const available = await this.emailService.validateEmailForAccount(emailAddress);
			if (!available) {
				ctx.status = 400;
				return;
			}
		}
	
		if (instance.disableRegistration) {
			if (invitationCode == null || typeof invitationCode !== 'string') {
				ctx.status = 400;
				return;
			}
	
			const ticket = await this.registrationTicketsRepository.findOneBy({
				code: invitationCode,
			});
	
			if (ticket == null) {
				ctx.status = 400;
				return;
			}
	
			this.registrationTicketsRepository.delete(ticket.id);
		}
	
		if (instance.emailRequiredForSignup) {
			const code = rndstr('a-z0-9', 16);
	
			// Generate hash of password
			const salt = await bcrypt.genSalt(8);
			const hash = await bcrypt.hash(password, salt);
	
			await this.userPendingsRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				code,
				email: emailAddress,
				username: username,
				password: hash,
			});
	
			const link = `${this.config.url}/signup-complete/${code}`;
	
			this.emailService.sendEmail(emailAddress, 'Signup',
				`To complete signup, please click this link:<br><a href="${link}">${link}</a>`,
				`To complete signup, please click this link: ${link}`);
	
			ctx.status = 204;
		} else {
			try {
				const { account, secret } = await this.signupService.signup({
					username, password, host,
				});
	
				const res = await this.userEntityService.pack(account, account, {
					detail: true,
					includeSecrets: true,
				});
	
				(res as any).token = secret;
	
				ctx.body = res;
			} catch (e) {
				ctx.throw(400, e);
			}
		}
	}

	public async signupPending(ctx: Koa.Context) {
		const body = ctx.request.body;

		const code = body['code'];

		try {
			const pendingUser = await this.userPendingsRepository.findOneByOrFail({ code });

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

			this.signinService.signin(ctx, account as ILocalUser);
		} catch (e) {
			ctx.throw(400, e);
		}
	}
}
