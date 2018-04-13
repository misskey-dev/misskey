import * as mongo from 'mongodb';
import db from '../db/mongodb';

const MessagingHistory = db.get<IMessagingHistory>('messagingHistories');
export default MessagingHistory;

export type IMessagingHistory = {
	_id: mongo.ObjectID;
	updatedAt: Date;
	userId: mongo.ObjectID;
	partnerId: mongo.ObjectID;
	messageId: mongo.ObjectID;
};

/**
 * MessagingHistoryを物理削除します
 */
export async function deleteMessagingHistory(messagingHistory: string | mongo.ObjectID | IMessagingHistory) {
	let m: IMessagingHistory;

	// Populate
	if (mongo.ObjectID.prototype.isPrototypeOf(messagingHistory)) {
		m = await MessagingHistory.findOne({
			_id: messagingHistory
		});
	} else if (typeof messagingHistory === 'string') {
		m = await MessagingHistory.findOne({
			_id: new mongo.ObjectID(messagingHistory)
		});
	} else {
		m = messagingHistory as IMessagingHistory;
	}

	if (m == null) return;

	// このMessagingHistoryを削除
	await MessagingHistory.remove({
		_id: m._id
	});
}
