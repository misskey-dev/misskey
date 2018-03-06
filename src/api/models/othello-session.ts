import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import db from '../../db/mongodb';

const Session = db.get<ISession>('othello_sessions');
export default Session;

export interface ISession {
	_id: mongo.ObjectID;
	code: string;
	user_id: mongo.ObjectID;
}

/**
 * Pack an othello session for API response
 *
 * @param {any} session
 * @return {Promise<any>}
 */
export const pack = (
	session: any
) => new Promise<any>(async (resolve, reject) => {

	const _session = deepcopy(session);

	delete _session._id;

	resolve(_session);
});
