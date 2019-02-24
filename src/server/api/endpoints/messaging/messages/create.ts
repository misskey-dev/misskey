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
import { ApiError } from '../../../error';
import { getUser } from '../../../common/getters';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーへMessagingのメッセージを送信します。',
		'en-US': 'Create a message of messaging.'
	},

	tags: ['messaging'],

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
	},

	res: {
		type: 'MessagingMessage',
	},

	errors: {
		recipientIsYourself: {
			message: 'You can not send a message to yourself.',
			code: 'RECIPIENT_IS_YOURSELF',
			id: '17e2ba79-e22a-4cbc-bf91-d327643f4a7e'
		},

		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '11795c64-40ea-4198-b06e-3c873ed9039d'
		},

		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: '4372b8e2-185d-4146-8749-2f68864a3e5f'
		},

		contentRequired: {
			message: 'Content required. You need to set text or fileId.',
			code: 'CONTENT_REQUIRED',
			id: '25587321-b0e6-449c-9239-f8925092942c'
		}
	}
};

export default define(meta, async (ps, user) => {
	// Myself
	if (ps.userId.equals(user._id)) {
		throw new ApiError(meta.errors.recipientIsYourself);
	}

	// Fetch recipient
	const recipient = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
		throw e;
	});

	let file = null;
	if (ps.fileId != null) {
		file = await DriveFile.findOne({
			_id: ps.fileId,
			'metadata.userId': user._id
		});

		if (file === null) {
			throw new ApiError(meta.errors.noSuchFile);
		}
	}

	// テキストが無いかつ添付ファイルも無かったらエラー
	if (ps.text == null && file == null) {
		throw new ApiError(meta.errors.contentRequired);
	}

	const message = await Message.insert({
		createdAt: new Date(),
		fileId: file ? file._id : undefined,
		recipientId: recipient._id,
		text: ps.text ? ps.text.trim() : undefined,
		userId: user._id,
		isRead: false
	});

	const messageObj = await pack(message);

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

	return messageObj;
});
