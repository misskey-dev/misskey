import * as mongo from 'mongodb';
import db from '../../../db/mongodb';

const MessagingHistory = db.get<IMessagingHistory>('messagingHistories');
export default MessagingHistory;

export type IMessagingHistory = {
	_id: mongo.ObjectID;
	updatedAt: Date;
	userId: mongo.ObjectID;
	partnerId: mongo.ObjectID;
	messageId: mongo.ObjectID;
};
