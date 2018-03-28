import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import db from '../../../db/mongodb';

const Signin = db.get<ISignin>('signin');
export default Signin;

export interface ISignin {
	_id: mongo.ObjectID;
}

/**
 * Pack a signin record for API response
 *
 * @param {any} record
 * @return {Promise<any>}
 */
export const pack = (
	record: any
) => new Promise<any>(async (resolve, reject) => {

	const _record = deepcopy(record);

	// Rename _id to id
	_record.id = _record._id;
	delete _record._id;

	resolve(_record);
});
