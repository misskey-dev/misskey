import * as mongo from 'mongodb';
import db from '../db/mongodb';
import isObjectId from '../misc/is-objectid';
const deepcopy = require('deepcopy');
import { pack as packUser } from './user';

const Blocking = db.get<IBlocking>('blocking');
Blocking.createIndex('blockerId');
Blocking.createIndex('blockeeId');
Blocking.createIndex(['blockerId', 'blockeeId'], { unique: true });
export default Blocking;

export type IBlocking = {
	_id: mongo.ObjectID;
	createdAt: Date;
	blockeeId: mongo.ObjectID;
	blockerId: mongo.ObjectID;
};

export const packMany = async (
	blockings: (string | mongo.ObjectID | IBlocking)[],
	me?: string | mongo.ObjectID | IUser
) => {
	return (await Promise.all(blockings.map(x => pack(x, me)))).filter(x => x != null);
};

export const pack = (
	blocking: any,
	me?: any
) => new Promise<any>(async (resolve, reject) => {
	let _blocking: any;

	// Populate the blocking if 'blocking' is ID
	if (isObjectId(blocking)) {
		_blocking = await Blocking.findOne({
			_id: blocking
		});
	} else if (typeof blocking === 'string') {
		_blocking = await Blocking.findOne({
			_id: new mongo.ObjectID(blocking)
		});
	} else {
		_blocking = deepcopy(blocking);
	}

	// Rename _id to id
	_blocking.id = _blocking._id;
	delete _blocking._id;

	// Populate blockee
	_blocking.blockee = await packUser(_blocking.blockeeId, me);

	resolve(_blocking);
});
