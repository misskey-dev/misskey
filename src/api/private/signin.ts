import * as express from 'express';
import * as bcrypt from 'bcrypt';
import User from '../models/user';
import Signin from '../models/signin';
import serialize from '../serializers/signin';
import event from '../event';

export default async (req: express.Request, res: express.Response) => {
	res.header('Access-Control-Allow-Credentials', 'true');

	const username = req.body['username'];
	const password = req.body['password'];

	// Fetch user
	const user = await User.findOne({
		username_lower: username.toLowerCase()
	});

	if (user === null) {
		res.status(404).send('user not found');
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
		res.status(400).send('incorrect password');
	}

	// Append signin history
	const inserted = await Signin.insert({
		created_at: new Date(),
		user_id: user._id,
		ip: req.ip,
		headers: req.headers,
		success: same
	});

	const record = inserted.ops[0];

	// Publish signin event
	event(user._id, 'signin', await serialize(record));
};
