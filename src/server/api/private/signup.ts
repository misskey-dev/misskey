import * as Koa from 'koa';
import * as bcrypt from 'bcryptjs';
import { generate as generateKeypair } from '../../../crypto_key';
import { validateUsername, validatePassword, pack } from '../../../models/user';
import generateUserToken from '../common/generate-native-user-token';
import config from '../../../config';
import Meta from '../../../models/meta';
import RegistrationTicket from '../../../models/registration-tickets';
import usersChart from '../../../services/chart/users';
import fetchMeta from '../../../misc/fetch-meta';
import * as recaptcha from 'recaptcha-promise';
import rndstr from 'rndstr';

export default async (ctx: Koa.BaseContext) => {
	const body = ctx.request.body as any;

	const instance = await fetchMeta();

	// Verify recaptcha
	// ただしテスト時はこの機構は障害となるため無効にする
	if (process.env.NODE_ENV !== 'test' && instance.enableRecaptcha) {
		recaptcha.init({
			secret_key: instance.recaptchaSecretKey
		});

		const success = await recaptcha(body['g-recaptcha-response']);

		if (!success) {
			ctx.throw(400, 'recaptcha-failed');
			return;
		}
	}

	const username = body['username'];
	const password = body['password'];
	const invitationCode = body['invitationCode'];

	if (instance && instance.disableRegistration) {
		if (invitationCode == null || typeof invitationCode != 'string') {
			ctx.status = 400;
			return;
		}

		const ticket = await RegistrationTicket.findOne({
			code: invitationCode
		});

		if (ticket == null) {
			ctx.status = 400;
			return;
		}

		RegistrationTicket.remove({
			_id: ticket._id
		});
	}

	// Validate username
	if (!validateUsername(username)) {
		ctx.status = 400;
		return;
	}

	// Validate password
	if (!validatePassword(password)) {
		ctx.status = 400;
		return;
	}

	const usersCount = await User.count({});

	// Generate hash of password
	const salt = await bcrypt.genSalt(8);
	const hash = await bcrypt.hash(password, salt);

	// Generate secret
	const secret = generateUserToken();

	const account = new User({
		id: rndstr('a-z0-9', 24),
		createdAt: new Date(),
		username: username,
		usernameLower: username.toLowerCase(),
		keypair: generateKeypair(),
		token: secret,
		password: hash,
		isAdmin: config.autoAdmin && usersCount === 0,
		autoAcceptFollowed: true,
		autoWatch: false
	});
	account.save();

	//#region Increment users count
	Meta.update({}, {
		$inc: {
			'stats.usersCount': 1,
			'stats.originalUsersCount': 1
		}
	}, { upsert: true });
	//#endregion

	usersChart.update(account, true);

	const res = await pack(account, account, {
		detail: true,
		includeSecrets: true
	});

	res.token = secret;

	ctx.body = res;
};
