import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import db from '../../../db/mongodb';
import { pack as packApp } from './app';

const AuthSession = db.get<IAuthSession>('authSessions');
export default AuthSession;

export interface IAuthSession {
	_id: mongo.ObjectID;
	createdAt: Date;
	appId: mongo.ObjectID;
	userId: mongo.ObjectID;
	token: string;
}

/**
 * Pack an auth session for API response
 *
 * @param {any} session
 * @param {any} me?
 * @return {Promise<any>}
 */
export const pack = (
	session: any,
	me?: any
) => new Promise<any>(async (resolve, reject) => {
	let _session: any;

	// TODO: Populate session if it ID
	_session = deepcopy(session);

	// Me
	if (me && !mongo.ObjectID.prototype.isPrototypeOf(me)) {
		if (typeof me === 'string') {
			me = new mongo.ObjectID(me);
		} else {
			me = me._id;
		}
	}

	delete _session._id;

	// Populate app
	_session.app = await packApp(_session.appId, me);

	resolve(_session);
});
