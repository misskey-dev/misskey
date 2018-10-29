import * as mongo from 'mongodb';
import db from '../db/mongodb';
import isObjectId from '../misc/is-objectid';

const Blocking = db.get<IBlocking>('blocking');
Blocking.createIndex(['blockerId', 'blockeeId'], { unique: true });
export default Blocking;

export type IBlocking = {
	_id: mongo.ObjectID;
	createdAt: Date;
	blockeeId: mongo.ObjectID;
	blockerId: mongo.ObjectID;
};

/**
 * Blockingを物理削除します
 */
export async function deleteBlocking(blocking: string | mongo.ObjectID | IBlocking) {
	let f: IBlocking;

	// Populate
	if (isObjectId(blocking)) {
		f = await Blocking.findOne({
			_id: blocking
		});
	} else if (typeof blocking === 'string') {
		f = await Blocking.findOne({
			_id: new mongo.ObjectID(blocking)
		});
	} else {
		f = blocking as IBlocking;
	}

	if (f == null) return;

	// このBlockingを削除
	await Blocking.remove({
		_id: f._id
	});
}
