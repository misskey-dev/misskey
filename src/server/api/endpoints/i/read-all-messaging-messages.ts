import { publishMainStream } from '../../../../services/stream';
import define from '../../define';
import { MessagingMessages, UserGroupJoinings } from '../../../../models';

export const meta = {
	desc: {
		'ja-JP': 'トークメッセージをすべて既読にします。',
		'en-US': 'Mark all talk messages as read.'
	},

	tags: ['account', 'messaging'],

	requireCredential: true as const,

	kind: 'write:account',

	params: {
	}
};

export default define(meta, async (ps, user) => {
	// Update documents
	await MessagingMessages.update({
		recipientId: user.id,
		isRead: false
	}, {
		isRead: true
	});

	const joinings = await UserGroupJoinings.find({ userId: user.id });

	await Promise.all(joinings.map(j => MessagingMessages.createQueryBuilder().update()
		.set({
			reads: (() => `array_append("reads", '${user.id}')`) as any
		})
		.where(`groupId = :groupId`, { groupId: j.userGroupId })
		.andWhere('userId != :userId', { userId: user.id })
		.andWhere('NOT (:userId = ANY(reads))', { userId: user.id })
		.execute()));

	publishMainStream(user.id, 'readAllMessagingMessages');
});
