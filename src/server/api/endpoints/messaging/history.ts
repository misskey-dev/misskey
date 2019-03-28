import $ from 'cafy';
import define from '../../define';
import { MessagingMessage } from '../../../../models/entities/messaging-message';
import { MessagingMessages, Mutings } from '../../../../models';

export const meta = {
	desc: {
		'ja-JP': 'Messagingの履歴を取得します。',
		'en-US': 'Show messaging history.'
	},

	tags: ['messaging'],

	requireCredential: true,

	kind: 'messaging-read',

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		}
	},

	res: {
		type: 'array',
		items: {
			type: 'MessagingMessage',
		},
	},
};

export default define(meta, async (ps, user) => {
	const mute = await Mutings.find({
		muterId: user.id,
	});

	const history: MessagingMessage[] = [];

	for (let i = 0; i < ps.limit; i++) {
		const found = history.map(m => (m.userId === user.id) ? m.recipientId : m.userId);

		const message = await MessagingMessages.createQueryBuilder('message')
			.where(`message.userId = :userId OR message.recipientId = :userId`, { userId: user.id })
			.andWhere(`message.userId NOT IN (:...found) AND message.recipientId NOT IN (:...found)`, { found: found })
			.andWhere(`message.userId NOT IN (:...mute) AND message.recipientId NOT IN (:...mute)`, { mute: mute.map(m => m.muteeId) })
			.orderBy('createdAt', 'DESC')
			.getOne();

		if (message) {
			history.push(message);
		} else {
			break;
		}
	}

	return await Promise.all(history.map(h => MessagingMessages.pack(h.id, user)));
});
