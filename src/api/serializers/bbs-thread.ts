/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import { IUser } from '../models/user';
import { default as Thread, IBbsThread } from '../models/bbs-thread';

/**
 * Serialize a thread
 *
 * @param thread target
 * @param me? serializee
 * @return response
 */
export default (
	thread: string | mongo.ObjectID | IBbsThread,
	me?: string | mongo.ObjectID | IUser
) => new Promise<any>(async (resolve, reject) => {

	let _thread: any;

	// Populate the thread if 'thread' is ID
	if (mongo.ObjectID.prototype.isPrototypeOf(thread)) {
		_thread = await Thread.findOne({
			_id: thread
		});
	} else if (typeof thread === 'string') {
		_thread = await Thread.findOne({
			_id: new mongo.ObjectID(thread)
		});
	} else {
		_thread = deepcopy(thread);
	}

	// Rename _id to id
	_thread.id = _thread._id;
	delete _thread._id;

	// Remove needless properties
	delete _thread.user_id;

	resolve(_thread);
});
