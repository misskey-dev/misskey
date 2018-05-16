import * as mongo from 'mongodb';
import Message from '../../../models/messaging-message';
import { IMessagingMessage as IMessage } from '../../../models/messaging-message';
import publishUserStream from '../../../publishers/stream';
import { publishMessagingStream } from '../../../publishers/stream';
import { publishMessagingIndexStream } from '../../../publishers/stream';

/**
 * Mark as read message(s)
 */
export default (
	user: string | mongo.ObjectID,
	otherparty: string | mongo.ObjectID,
	message: string | string[] | IMessage | IMessage[] | mongo.ObjectID | mongo.ObjectID[]
) => new Promise<any>(async (resolve, reject) => {

	const userId = mongo.ObjectID.prototype.isPrototypeOf(user)
		? user
		: new mongo.ObjectID(user);

	const otherpartyId = mongo.ObjectID.prototype.isPrototypeOf(otherparty)
		? otherparty
		: new mongo.ObjectID(otherparty);

	const ids: mongo.ObjectID[] = Array.isArray(message)
		? mongo.ObjectID.prototype.isPrototypeOf(message[0])
			? (message as mongo.ObjectID[])
			: typeof message[0] === 'string'
				? (message as string[]).map(m => new mongo.ObjectID(m))
				: (message as IMessage[]).map(m => m._id)
		: mongo.ObjectID.prototype.isPrototypeOf(message)
			? [(message as mongo.ObjectID)]
			: typeof message === 'string'
				? [new mongo.ObjectID(message)]
				: [(message as IMessage)._id];

	// Update documents
	await Message.update({
		_id: { $in: ids },
		userId: otherpartyId,
		recipientId: userId,
		isRead: false
	}, {
		$set: {
			isRead: true
		}
	}, {
		multi: true
	});

	// Publish event
	publishMessagingStream(otherpartyId, userId, 'read', ids.map(id => id.toString()));
	publishMessagingIndexStream(userId, 'read', ids.map(id => id.toString()));

	// Calc count of my unread messages
	const count = await Message
		.count({
			recipientId: userId,
			isRead: false
		}, {
			limit: 1
		});

	if (count == 0) {
		// 全ての(いままで未読だった)自分宛てのメッセージを(これで)読みましたよというイベントを発行
		publishUserStream(userId, 'read_all_messaging_messages');
	}
});
