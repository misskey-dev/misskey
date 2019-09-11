import $ from 'cafy';
import { ID } from '../../../../../misc/cafy-id';
import { publishMainStream, publishGroupMessagingStream } from '../../../../../services/stream';
import { publishMessagingStream, publishMessagingIndexStream } from '../../../../../services/stream';
import pushSw from '../../../../../services/push-notification';
import define from '../../../define';
import { ApiError } from '../../../error';
import { getUser } from '../../../common/getters';
import { MessagingMessages, DriveFiles, Mutings, UserGroups, UserGroupJoinings } from '../../../../../models';
import { MessagingMessage } from '../../../../../models/entities/messaging-message';
import { genId } from '../../../../../misc/gen-id';
import { User } from '../../../../../models/entities/user';
import { UserGroup } from '../../../../../models/entities/user-group';
import { Not } from 'typeorm';

export const meta = {
	desc: {
		'ja-JP': 'トークメッセージを送信します。',
		'en-US': 'Create a message of messaging.'
	},

	tags: ['messaging'],

	requireCredential: true,

	kind: 'write:messaging',

	params: {
		userId: {
			validator: $.optional.type(ID),
			desc: {
				'ja-JP': '対象のユーザーのID',
				'en-US': 'Target user ID'
			}
		},

		groupId: {
			validator: $.optional.type(ID),
			desc: {
				'ja-JP': '対象のグループのID',
				'en-US': 'Target group ID'
			}
		},

		text: {
			validator: $.optional.str.pipe(MessagingMessages.validateText)
		},

		fileId: {
			validator: $.optional.type(ID),
		}
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		ref: 'MessagingMessage',
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

		noSuchGroup: {
			message: 'No such group.',
			code: 'NO_SUCH_GROUP',
			id: 'c94e2a5d-06aa-4914-8fa6-6a42e73d6537'
		},

		groupAccessDenied: {
			message: 'You can not send messages to groups that you have not joined.',
			code: 'GROUP_ACCESS_DENIED',
			id: 'd96b3cca-5ad1-438b-ad8b-02f931308fbd'
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
	let recipientUser: User | undefined;
	let recipientGroup: UserGroup | undefined;

	if (ps.userId != null) {
		// Myself
		if (ps.userId === user.id) {
			throw new ApiError(meta.errors.recipientIsYourself);
		}

		// Fetch recipient (user)
		recipientUser = await getUser(ps.userId).catch(e => {
			if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
			throw e;
		});
	} else if (ps.groupId != null) {
		// Fetch recipient (group)
		recipientGroup = await UserGroups.findOne(ps.groupId);

		if (recipientGroup == null) {
			throw new ApiError(meta.errors.noSuchGroup);
		}

		// check joined
		const joining = await UserGroupJoinings.findOne({
			userId: user.id,
			userGroupId: recipientGroup.id
		});

		if (joining == null) {
			throw new ApiError(meta.errors.groupAccessDenied);
		}
	}

	let file = null;
	if (ps.fileId != null) {
		file = await DriveFiles.findOne({
			id: ps.fileId,
			userId: user.id
		});

		if (file == null) {
			throw new ApiError(meta.errors.noSuchFile);
		}
	}

	// テキストが無いかつ添付ファイルも無かったらエラー
	if (ps.text == null && file == null) {
		throw new ApiError(meta.errors.contentRequired);
	}

	const message = await MessagingMessages.save({
		id: genId(),
		createdAt: new Date(),
		fileId: file ? file.id : null,
		recipientId: recipientUser ? recipientUser.id : null,
		groupId: recipientGroup ? recipientGroup.id : null,
		text: ps.text ? ps.text.trim() : null,
		userId: user.id,
		isRead: false,
		reads: [] as any[]
	} as MessagingMessage);

	const messageObj = await MessagingMessages.pack(message);

	if (recipientUser) {
		// 自分のストリーム
		publishMessagingStream(message.userId, recipientUser.id, 'message', messageObj);
		publishMessagingIndexStream(message.userId, 'message', messageObj);
		publishMainStream(message.userId, 'messagingMessage', messageObj);

		// 相手のストリーム
		publishMessagingStream(recipientUser.id, message.userId, 'message', messageObj);
		publishMessagingIndexStream(recipientUser.id, 'message', messageObj);
		publishMainStream(recipientUser.id, 'messagingMessage', messageObj);
	} else if (recipientGroup) {
		// グループのストリーム
		publishGroupMessagingStream(recipientGroup.id, 'message', messageObj);

		// メンバーのストリーム
		const joinings = await UserGroupJoinings.find({ userGroupId: recipientGroup.id });
		for (const joining of joinings) {
			publishMessagingIndexStream(joining.userId, 'message', messageObj);
			publishMainStream(joining.userId, 'messagingMessage', messageObj);
		}
	}

	// 2秒経っても(今回作成した)メッセージが既読にならなかったら「未読のメッセージがありますよ」イベントを発行する
	setTimeout(async () => {
		const freshMessage = await MessagingMessages.findOne(message.id);
		if (freshMessage == null) return; // メッセージが削除されている場合もある

		if (recipientUser) {
			if (freshMessage.isRead) return; // 既読

			//#region ただしミュートされているなら発行しない
			const mute = await Mutings.find({
				muterId: recipientUser.id,
			});
			if (mute.map(m => m.muteeId).includes(user.id)) return;
			//#endregion

			publishMainStream(recipientUser.id, 'unreadMessagingMessage', messageObj);
			pushSw(recipientUser.id, 'unreadMessagingMessage', messageObj);
		} else if (recipientGroup) {
			const joinings = await UserGroupJoinings.find({ userGroupId: recipientGroup.id, userId: Not(user.id) });
			for (const joining of joinings) {
				if (freshMessage.reads.includes(joining.userId)) return; // 既読
				publishMainStream(joining.userId, 'unreadMessagingMessage', messageObj);
				pushSw(joining.userId, 'unreadMessagingMessage', messageObj);
			}
		}
	}, 2000);

	return messageObj;
});
