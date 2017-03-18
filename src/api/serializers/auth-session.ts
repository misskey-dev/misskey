/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import serializeApp from './app';

/**
 * Serialize an auth session
 *
 * @param {any} session
 * @param {any} me?
 * @return {Promise<any>}
 */
export default (
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
	_session.app = await serializeApp(_session.app_id, me);

	resolve(_session);
});
