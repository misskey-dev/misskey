import Koa from 'koa';
import rndstr from 'rndstr';
import bcrypt from 'bcryptjs';
import { fetchMeta } from '@/misc/fetch-meta.js';
import { verifyHcaptcha, verifyRecaptcha } from '@/misc/captcha.js';
import { Users, RegistrationTickets, UserPendings } from '@/models/index.js';
import { signup } from '../common/signup.js';
import config from '@/config/index.js';
import { sendEmail } from '@/services/send-email.js';
import { genId } from '@/misc/gen-id.js';
import { validateEmailForAccount } from '@/services/validate-email-for-account.js';

export default async (ctx: Koa.Context) => {
	const body = ctx.request.body;

	const instance = await fetchMeta(true);

	// Verify *Captcha
	// ただしテスト時はこの機構は障害となるため無効にする
	if (process.env.NODE_ENV !== 'test') {
		if (instance.enableHcaptcha && instance.hcaptchaSecretKey) {
			// @ts-ignore
			await verifyHcaptcha(instance.hcaptchaSecretKey, body['hcaptcha-response']).catch(e => {
				ctx.throw(400, e);
			});
		}

		if (instance.enableRecaptcha && instance.recaptchaSecretKey) {
			// @ts-ignore
			await verifyRecaptcha(instance.recaptchaSecretKey, body['g-recaptcha-response']).catch(e => {
				ctx.throw(400, e);
			});
		}
	}

	// @ts-ignore
	const username = body['username'];
	// @ts-ignore
	const password = body['password'];
	// @ts-ignore
	const host: string | null = process.env.NODE_ENV === 'test' ? (body['host'] || null) : null;
	// @ts-ignore
	const invitationCode = body['invitationCode'];
	// @ts-ignore
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

		const ticket = await RegistrationTickets.findOneBy({
			code: invitationCode,
		});

		if (ticket == null) {
			ctx.status = 400;
			return;
		}

		RegistrationTickets.delete(ticket.id);
	}

	if (instance.emailRequiredForSignup) {
		const code = rndstr('a-z0-9', 16);

		// Generate hash of password
		const salt = await bcrypt.genSalt(8);
		const hash = await bcrypt.hash(password, salt);

		await UserPendings.insert({
			id: genId(),
			createdAt: new Date(),
			code,
			email: emailAddress,
			username: username,
			password: hash,
		});

		const link = `${config.url}/signup-complete/${code}`;

		sendEmail(emailAddress, 'Signup',
			`To complete signup, please click this link:<br><a href="${link}">${link}</a>`,
			`To complete signup, please click this link: ${link}`);

		ctx.status = 204;
	} else {
		try {
			const { account, secret } = await signup({
				username, password, host,
			});

			const res = await Users.pack(account, account, {
				detail: true,
				includeSecrets: true,
			});

			(res as any).token = secret;

			ctx.body = res;
		} catch (e) {
			// @ts-ignore
			ctx.throw(400, e);
		}
	}
};
