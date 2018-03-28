/**
 * Module dependencies
 */
import $ from 'cafy';
import Message from '../../../models/messaging-message';
import { isValidText } from '../../../models/messaging-message';
import History from '../../../models/messaging-history';
import User from '../../../models/user';
import Mute from '../../../models/mute';
import DriveFile from '../../../models/drive-file';
import { pack } from '../../../models/messaging-message';
import publishUserStream from '../../../event';
import { publishMessagingStream, publishMessagingIndexStream, pushSw } from '../../../event';
import config from '../../../../../conf';

/**
 * Create a message
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'user_id' parameter
	const [recipientId, recipientIdErr] = $(params.user_id).id().$;
	if (recipientIdErr) return rej('invalid user_id param');

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
	const [text, textErr] = $(params.text).optional.string().pipe(isValidText).$;
	if (textErr) return rej('invalid text');

	// Get 'file_id' parameter
	const [fileId, fileIdErr] = $(params.file_id).optional.id().$;
	if (fileIdErr) return rej('invalid file_id param');

	let file = null;
	if (fileId !== undefined) {
		file = await DriveFile.findOne({
			_id: fileId,
			'metadata.user_id': user._id
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
		created_at: new Date(),
		file_id: file ? file._id : undefined,
		recipient_id: recipient._id,
		text: text ? text : undefined,
		user_id: user._id,
		is_read: false
	});

	// Serialize
	const messageObj = await pack(message);

	// Reponse
	res(messageObj);

	// 自分のストリーム
	publishMessagingStream(message.user_id, message.recipient_id, 'message', messageObj);
	publishMessagingIndexStream(message.user_id, 'message', messageObj);
	publishUserStream(message.user_id, 'messaging_message', messageObj);

	// 相手のストリーム
	publishMessagingStream(message.recipient_id, message.user_id, 'message', messageObj);
	publishMessagingIndexStream(message.recipient_id, 'message', messageObj);
	publishUserStream(message.recipient_id, 'messaging_message', messageObj);

	// 3秒経っても(今回作成した)メッセージが既読にならなかったら「未読のメッセージがありますよ」イベントを発行する
	setTimeout(async () => {
		const freshMessage = await Message.findOne({ _id: message._id }, { is_read: true });
		if (!freshMessage.is_read) {
			//#region ただしミュートされているなら発行しない
			const mute = await Mute.find({
				muter_id: recipient._id,
				deleted_at: { $exists: false }
			});
			const mutedUserIds = mute.map(m => m.mutee_id.toString());
			if (mutedUserIds.indexOf(user._id.toString()) != -1) {
				return;
			}
			//#endregion

			publishUserStream(message.recipient_id, 'unread_messaging_message', messageObj);
			pushSw(message.recipient_id, 'unread_messaging_message', messageObj);
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
		user_id: user._id,
		partner: recipient._id
	}, {
		updated_at: new Date(),
		user_id: user._id,
		partner: recipient._id,
		message: message._id
	}, {
		upsert: true
	});

	// 履歴作成(相手)
	History.update({
		user_id: recipient._id,
		partner: user._id
	}, {
		updated_at: new Date(),
		user_id: recipient._id,
		partner: user._id,
		message: message._id
	}, {
		upsert: true
	});
});
