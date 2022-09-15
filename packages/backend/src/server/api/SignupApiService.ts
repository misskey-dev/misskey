import { Inject, Injectable } from '@nestjs/common';
import rndstr from 'rndstr';
import bcrypt from 'bcryptjs';
import { DI_SYMBOLS } from '@/di-symbols.js';
import type { RegistrationTickets , UserPendings, UserProfiles , Users } from '@/models/index.js';

import { Config } from '@/config.js';
import { MetaService } from '@/services/MetaService.js';
import { CaptchaService } from '@/services/CaptchaService.js';
import { IdService } from '@/services/IdService.js';
import { SignupService } from '@/services/SignupService.js';
import { UserEntityService } from '@/services/entities/UserEntityService.js';
import { SigninService } from '../SigninService.js';
import type Koa from 'koa';

@Injectable()
export class SignupApiService {
	constructor(
		@Inject(DI_SYMBOLS.config)
		private config: Config,

		@Inject('usersRepository')
		private usersRepository: typeof Users,

		@Inject('userProfilesRepository')
		private userProfilesRepository: typeof UserProfiles,

		@Inject('userPendingsRepository')
		private userPendingsRepository: typeof UserPendings,

		@Inject('registrationTicketsRepository')
		private registrationTicketsRepository: typeof RegistrationTickets,

		private userEntityService: UserEntityService,
		private idService: IdService,
		private metaService: MetaService,
		private captchaService: CaptchaService,
		private signupService: SignupService,
		private signinService: SigninService,
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
		}
	
		const username = body['username'];
		const password = body['password'];
		const host: string | null = process.env.NODE_ENV === 'test' ? (body['host'] || null) : null;
		const invitationCode = body['invitationCode'];
		const emailAddress = body['emailAddress'];
	
		if (instance.emailRequiredForSignup) {
			if (emailAddress == null || typeof emailAddress !== 'string') {
				ctx.status = 400;
				return;
			}
	
			const available = await validateEmailForAccount(emailAddress);
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
	
			sendEmail(emailAddress, 'Signup',
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

			this.signinService.signin(ctx, account);
		} catch (e) {
			ctx.throw(400, e);
		}
	}
}
