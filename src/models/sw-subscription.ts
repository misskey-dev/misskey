import * as mongo from 'mongodb';
import db from '../db/mongodb';

const SwSubscription = db.get<ISwSubscription>('swSubscriptions');
export default SwSubscription;

export interface ISwSubscription {
	_id: mongo.ObjectID;
	userId: mongo.ObjectID;
	endpoint: string;
	auth: string;
	publickey: string;
}

/**
 * SwSubscriptionを物理削除します
 */
export async function deleteSwSubscription(swSubscription: string | mongo.ObjectID | ISwSubscription) {
	let s: ISwSubscription;

	// Populate
	if (mongo.ObjectID.prototype.isPrototypeOf(swSubscription)) {
		s = await SwSubscription.findOne({
			_id: swSubscription
		});
	} else if (typeof swSubscription === 'string') {
		s = await SwSubscription.findOne({
			_id: new mongo.ObjectID(swSubscription)
		});
	} else {
		s = swSubscription as ISwSubscription;
	}

	if (s == null) return;

	// このSwSubscriptionを削除
	await SwSubscription.remove({
		_id: s._id
	});
}

