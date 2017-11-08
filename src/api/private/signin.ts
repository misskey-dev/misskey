import * as express from 'express';
import * as bcrypt from 'bcryptjs';
import { default as User, IUser } from '../models/user';
import Signin from '../models/signin';
import serialize from '../serializers/signin';
import event from '../event';
import config from '../../conf';

export default async (req: express.Request, res: express.Response) => {
	res.header('Access-Control-Allow-Credentials', 'true');

	const username = req.body['username'];
	const password = req.body['password'];

	if (typeof username != 'string') {
		res.sendStatus(400);
		return;
	}

	if (typeof password != 'string') {
		res.sendStatus(400);
		return;
	}

	// Fetch user
	const user: IUser = await User.findOne({
		username_lower: username.toLowerCase()
	}, {
		fields: {
			data: false,
			profile: false
		}
	});

	if (user === null) {
		res.status(404).send({
			error: 'user not found'
		});
		return;
	}

	// Compare password
	const same = await bcrypt.compare(password, user.password);

	if (same) {
		const expires = 1000 * 60 * 60 * 24 * 365; // One Year
		res.cookie('i', user.token, {
			path: '/',
			domain: `.${config.host}`,
			secure: config.url.substr(0, 5) === 'https',
			httpOnly: false,
			expires: new Date(Date.now() + expires),
			maxAge: expires
		});

		res.sendStatus(204);
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
	event(user._id, 'signin', await serialize(record));
};
