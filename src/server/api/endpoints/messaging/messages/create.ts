/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../../cafy-id';
import Message from '../../../../../models/messaging-message';
import { isValidText } from '../../../../../models/messaging-message';
import History from '../../../../../models/messaging-history';
import User from '../../../../../models/user';
import Mute from '../../../../../models/mute';
import DriveFile from '../../../../../models/drive-file';
import { pack } from '../../../../../models/messaging-message';
import publishUserStream from '../../../../../publishers/stream';
import { publishMessagingStream, publishMessagingIndexStream } from '../../../../../publishers/stream';
import pushSw from '../../../../../publishers/push-sw';
import config from '../../../../../config';

/**
 * Create a message
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'userId' parameter
	const [recipientId, recipientIdErr] = $.type(ID).get(params.userId);
	if (recipientIdErr) return rej('invalid userId param');

	// Myself
	if (recipientId.equals(user._id)) {
		return rej('cannot send message to myself');
	}

	// Fetch recipient
	const recipient = await User.findOne({
		_id: recipientId
	}, {
		fields: {
			_id: true
		}
	});

	if (recipient === null) {
		return rej('user not found');
	}

	// Get 'text' parameter
	const [text, textErr] = $.str.optional().pipe(isValidText).get(params.text);
	if (textErr) return rej('invalid text');

	// Get 'fileId' parameter
	const [fileId, fileIdErr] = $.type(ID).optional().get(params.fileId);
	if (fileIdErr) return rej('invalid fileId param');

	let file = null;
	if (fileId !== undefined) {
		file = await DriveFile.findOne({
			_id: fileId,
			'metadata.userId': user._id
		});

		if (file === null) {
			return rej('file not found');
		}
	}

	// テキストが無いかつ添付ファイルも無かったらエラー
	if (text === undefined && file === null) {
		return rej('text or file is required');
	}

	// メッセージを作成
	const message = await Message.insert({
		createdAt: new Date(),
		fileId: file ? file._id : undefined,
		recipientId: recipient._id,
		text: text ? text : undefined,
		userId: user._id,
		isRead: false
	});

	// Serialize
	const messageObj = await pack(message);

	// Reponse
	res(messageObj);

	// 自分のストリーム
	publishMessagingStream(message.userId, message.recipientId, 'message', messageObj);
	publishMessagingIndexStream(message.userId, 'message', messageObj);
	publishUserStream(message.userId, 'messaging_message', messageObj);

	// 相手のストリーム
	publishMessagingStream(message.recipientId, message.userId, 'message', messageObj);
	publishMessagingIndexStream(message.recipientId, 'message', messageObj);
	publishUserStream(message.recipientId, 'messaging_message', messageObj);

	// Update flag
	User.update({ _id: recipient._id }, {
		$set: {
			hasUnreadMessagingMessage: true
		}
	});

	// 3秒経っても(今回作成した)メッセージが既読にならなかったら「未読のメッセージがありますよ」イベントを発行する
	setTimeout(async () => {
		const freshMessage = await Message.findOne({ _id: message._id }, { isRead: true });
		if (!freshMessage.isRead) {
			//#region ただしミュートされているなら発行しない
			const mute = await Mute.find({
				muterId: recipient._id,
				deletedAt: { $exists: false }
			});
			const mutedUserIds = mute.map(m => m.muteeId.toString());
			if (mutedUserIds.indexOf(user._id.toString()) != -1) {
				return;
			}
			//#endregion

			publishUserStream(message.recipientId, 'unread_messaging_message', messageObj);
			pushSw(message.recipientId, 'unread_messaging_message', messageObj);
		}
	}, 3000);

	// Register to search database
	if (message.text && config.elasticsearch.enable) {
		const es = require('../../../db/elasticsearch');

		es.index({
			index: 'misskey',
			type: 'messaging_message',
			id: message._id.toString(),
			body: {
				text: message.text
			}
		});
	}

	// 履歴作成(自分)
	History.update({
		userId: user._id,
		partnerId: recipient._id
	}, {
		updatedAt: new Date(),
		userId: user._id,
		partnerId: recipient._id,
		messageId: message._id
	}, {
		upsert: true
	});

	// 履歴作成(相手)
	History.update({
		userId: recipient._id,
		partnerId: user._id
	}, {
		updatedAt: new Date(),
		userId: recipient._id,
		partnerId: user._id,
		messageId: message._id
	}, {
		upsert: true
	});
});
