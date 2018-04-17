import * as mongo from 'mongodb';
import db from '../db/mongodb';

const Mute = db.get<IMute>('mute');
Mute.createIndex(['muterId', 'muteeId'], { unique: true });
export default Mute;

export interface IMute {
	_id: mongo.ObjectID;
	createdAt: Date;
	muterId: mongo.ObjectID;
	muteeId: mongo.ObjectID;
}

/**
 * Muteを物理削除します
 */
export async function deleteMute(mute: string | mongo.ObjectID | IMute) {
	let m: IMute;

	// Populate
	if (mongo.ObjectID.prototype.isPrototypeOf(mute)) {
		m = await Mute.findOne({
			_id: mute
		});
	} else if (typeof mute === 'string') {
		m = await Mute.findOne({
			_id: new mongo.ObjectID(mute)
		});
	} else {
		m = mute as IMute;
	}

	if (m == null) return;

	// このMuteを削除
	await Mute.remove({
		_id: m._id
	});
}
