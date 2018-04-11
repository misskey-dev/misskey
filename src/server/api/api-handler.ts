import * as express from 'express';

import { Endpoint } from './endpoints';
import authenticate from './authenticate';
import call from './call';
import { IUser } from '../../models/user';
import { IApp } from '../../models/app';

export default async (endpoint: Endpoint, req: express.Request, res: express.Response) => {
	const reply = (x?: any, y?: any) => {
		if (x === undefined) {
			res.sendStatus(204);
		} else if (typeof x === 'number') {
			res.status(x).send({
				error: x === 500 ? 'INTERNAL_ERROR' : y
			});
		} else {
			res.send(x);
		}
	};

	let user: IUser;
	let app: IApp;

	// Authentication
	try {
		[user, app] = await authenticate(req.body['i']);
	} catch (e) {
		return reply(403, 'AUTHENTICATION_FAILED');
	}

	// API invoking
	call(endpoint, user, app, req.body, req).then(reply).catch(e => reply(400, e));
};
