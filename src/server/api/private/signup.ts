import * as Koa from 'koa';
import { fetchMeta } from '../../../misc/fetch-meta';
import { verifyHcaptcha, verifyRecaptcha } from '../../../misc/captcha';
import { Users, RegistrationTickets } from '../../../models';
import { signup } from '../common/signup';

export default async (ctx: Koa.Context) => {
	const body = ctx.request.body;

	const instance = await fetchMeta(true);

	// Verify *Captcha
	// ただしテスト時はこの機構は障害となるため無効にする
	if (process.env.NODE_ENV !== 'test') {
		if (instance.enableHcaptcha && instance.hcaptchaSecretKey) {
			await verifyHcaptcha(instance.hcaptchaSecretKey, body['hcaptcha-response']).catch(e => {
				ctx.throw(400, e);
			});
		}

		if (instance.enableRecaptcha && instance.recaptchaSecretKey) {
			await verifyRecaptcha(instance.recaptchaSecretKey, body['g-recaptcha-response']).catch(e => {
				ctx.throw(400, e);
			});
		}
	}

	const username = body['username'];
	const password = body['password'];
	const host: string | null = process.env.NODE_ENV === 'test' ? (body['host'] || null) : null;
	const invitationCode = body['invitationCode'];

	if (instance && instance.disableRegistration) {
		if (invitationCode == null || typeof invitationCode != 'string') {
			ctx.status = 400;
			return;
		}

		const ticket = await RegistrationTickets.findOne({
			code: invitationCode
		});

		if (ticket == null) {
			ctx.status = 400;
			return;
		}

		RegistrationTickets.delete(ticket.id);
	}

	try {
		const { account, secret } = await signup(username, password, host);

		const res = await Users.pack(account, account, {
			detail: true,
			includeSecrets: true
		});

		(res as any).token = secret;

		ctx.body = res;
	} catch (e) {
		ctx.throw(400, e);
	}
};
