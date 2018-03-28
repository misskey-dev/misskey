import * as express from 'express';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import { default as User, ILocalAccount, IUser } from '../models/user';
import Signin, { pack } from '../models/signin';
import event from '../event';
import signin from '../common/signin';
import config from '../../../conf';

export default async (req: express.Request, res: express.Response) => {
	res.header('Access-Control-Allow-Origin', config.url);
	res.header('Access-Control-Allow-Credentials', 'true');

	const username = req.body['username'];
	const password = req.body['password'];
	const token = req.body['token'];

	if (typeof username != 'string') {
		res.sendStatus(400);
		return;
	}

	if (typeof password != 'string') {
		res.sendStatus(400);
		return;
	}

	if (token != null && typeof token != 'string') {
		res.sendStatus(400);
		return;
	}

	// Fetch user
	const user: IUser = await User.findOne({
		username_lower: username.toLowerCase(),
		host: null
	}, {
		fields: {
			data: false,
			'account.profile': false
		}
	});

	if (user === null) {
		res.status(404).send({
			error: 'user not found'
		});
		return;
	}

	const account = user.account as ILocalAccount;

	// Compare password
	const same = await bcrypt.compare(password, account.password);

	if (same) {
		if (account.two_factor_enabled) {
			const verified = (speakeasy as any).totp.verify({
				secret: account.two_factor_secret,
				encoding: 'base32',
				token: token
			});

			if (verified) {
				signin(res, user, false);
			} else {
				res.status(400).send({
					error: 'invalid token'
				});
			}
		} else {
			signin(res, user, false);
		}
	} else {
		res.status(400).send({
			error: 'incorrect password'
		});
	}

	// Append signin history
	const record = await Signin.insert({
		created_at: new Date(),
		user_id: user._id,
		ip: req.ip,
		headers: req.headers,
		success: same
	});

	// Publish signin event
	event(user._id, 'signin', await pack(record));
};
