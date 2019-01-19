import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import Message from '../../../../../models/messaging-message';
import { isValidText } from '../../../../../models/messaging-message';
import User from '../../../../../models/user';
import Mute from '../../../../../models/mute';
import DriveFile from '../../../../../models/drive-file';
import { pack } from '../../../../../models/messaging-message';
import { publishMainStream } from '../../../../../stream';
import { publishMessagingStream, publishMessagingIndexStream } from '../../../../../stream';
import pushSw from '../../../../../push-sw';
import define from '../../../define';
import { ObjectID } from 'mongodb';
import { error, errorWhen } from '../../../../../prelude/promise';

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
			validator: $.str.optional.pipe(isValidText)
		},

		fileId: {
			validator: $.type(ID).optional,
			transform: transform,
		}
	}
};

const fetchFile = (_id: ObjectID, userId: ObjectID) => _id ? DriveFile.findOne({
		_id,
		'metadata.userId': userId
	})
	.then(x =>
		x === null ? error('file not found') :
		x._id) : undefined;

export default define(meta, (ps, user) => errorWhen(
	ps.userId.equals(user._id),
	'cannot send message to myself')
	.then(() => User.findOne({ _id: ps.userId }, {
			fields: { _id: true }
		}))
	.then(async x => {
		if (x === null) throw 'user not found';
		const fileId = await fetchFile(ps.fileId, user._id);
		if (!ps.text && !fileId) throw 'text or file is required';
		return Message.insert({
			createdAt: new Date(),
			fileId,
			recipientId: x._id,
			text: ps.text && ps.text.trim(),
			userId: user._id,
			isRead: false
		});
	})
	.then(async x => pack(x)
		.then(response => (
			publishMessagingStream(x.userId, x.recipientId, 'message', response),
			publishMessagingIndexStream(x.userId, 'message', response),
			publishMainStream(x.userId, 'messagingMessage', response),
			publishMessagingStream(x.recipientId, x.userId, 'message', response),
			publishMessagingIndexStream(x.recipientId, 'message', response),
			publishMainStream(x.recipientId, 'messagingMessage', response),
			User.update({ _id: x._id }, {
				$set: { hasUnreadMessagingMessage: true }
			}),
			setTimeout(() => Message.findOne({ _id: x._id }, { isRead: true })
				.then(fresh =>
					!fresh || fresh.isRead ? error(null) :
					Mute.find({
						muterId: x._id,
						deletedAt: { $exists: false }
					}))
				.then(mute => {
					if (mute.map(m => m.muteeId.toString()).includes(user._id.toString())) return;
					publishMainStream(x.recipientId, 'unreadMessagingMessage', response);
					pushSw(x.recipientId, 'unreadMessagingMessage', response);
				}, _ => {}), 2000),
			x))));
