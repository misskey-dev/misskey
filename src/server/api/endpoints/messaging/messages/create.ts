import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import Message from '../../../../../models/messaging-message';
import { isValidText } from '../../../../../models/messaging-message';
import User from '../../../../../models/user';
import Mute from '../../../../../models/mute';
import DriveFile from '../../../../../models/drive-file';
import { pack } from '../../../../../models/messaging-message';
import { publishMainStream } from '../../../../../services/stream';
import { publishMessagingStream, publishMessagingIndexStream } from '../../../../../services/stream';
import pushSw from '../../../../../services/push-notification';
import define from '../../../define';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーへMessagingのメッセージを送信します。',
		'en-US': 'Create a message of messaging.'
	},

	requireCredential: true,

	kind: 'messaging-write',

	params: {
		userId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のユーザーのID',
				'en-US': 'Target user ID'
			}
		},

		text: {
			validator: $.optional.str.pipe(isValidText)
		},

		fileId: {
			validator: $.optional.type(ID),
			transform: transform,
		}
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	// Myself
	if (ps.userId.equals(user._id)) {
		return rej('cannot send message to myself');
	}

	// Fetch recipient
	const recipient = await User.findOne({
		_id: ps.userId
	}, {
		fields: {
			_id: true
		}
	});

	if (recipient === null) {
		return rej('user not found');
	}

	let file = null;
	if (ps.fileId != null) {
		file = await DriveFile.findOne({
			_id: ps.fileId,
			'metadata.userId': user._id
		});

		if (file === null) {
			return rej('file not found');
		}
	}

	// テキストが無いかつ添付ファイルも無かったらエラー
	if (ps.text == null && file == null) {
		return rej('text or file is required');
	}

	// メッセージを作成
	const message = await Message.insert({
		createdAt: new Date(),
		fileId: file ? file._id : undefined,
		recipientId: recipient._id,
		text: ps.text ? ps.text.trim() : undefined,
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
	publishMainStream(message.userId, 'messagingMessage', messageObj);

	// 相手のストリーム
	publishMessagingStream(message.recipientId, message.userId, 'message', messageObj);
	publishMessagingIndexStream(message.recipientId, 'message', messageObj);
	publishMainStream(message.recipientId, 'messagingMessage', messageObj);

	// Update flag
	User.update({ _id: recipient._id }, {
		$set: {
			hasUnreadMessagingMessage: true
		}
	});

	// 2秒経っても(今回作成した)メッセージが既読にならなかったら「未読のメッセージがありますよ」イベントを発行する
	setTimeout(async () => {
		const freshMessage = await Message.findOne({ _id: message._id }, { isRead: true });
		if (freshMessage == null) return; // メッセージが削除されている場合もある
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

			publishMainStream(message.recipientId, 'unreadMessagingMessage', messageObj);
			pushSw(message.recipientId, 'unreadMessagingMessage', messageObj);
		}
	}, 2000);
}));
