import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../../define';
import { ApiError } from '../../../error';
import { getUser } from '../../../common/getters';
import { MessagingMessages, DriveFiles, UserGroups, UserGroupJoinings, Blockings } from '@/models/index';
import { User } from '@/models/entities/user';
import { UserGroup } from '@/models/entities/user-group';
import { createMessage } from '@/services/messages/create';

export const meta = {
	tags: ['messaging'],

	requireCredential: true as const,

	kind: 'write:messaging',

	params: {
		userId: {
			validator: $.optional.type(ID),
		},

		groupId: {
			validator: $.optional.type(ID),
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
		},

		youHaveBeenBlocked: {
			message: 'You cannot send a message because you have been blocked by this user.',
			code: 'YOU_HAVE_BEEN_BLOCKED',
			id: 'c15a5199-7422-4968-941a-2a462c478f7d'
		},
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

		// Check blocking
		const block = await Blockings.findOne({
			blockerId: recipientUser.id,
			blockeeId: user.id,
		});
		if (block) {
			throw new ApiError(meta.errors.youHaveBeenBlocked);
		}
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

	return await createMessage(user, recipientUser, recipientGroup, ps.text, file);
});
