import $ from 'cafy';
import define from '../../define';
import { MessagingMessage } from '../../../../models/entities/messaging-message';
import { MessagingMessages, Mutings } from '../../../../models';
import { Brackets } from 'typeorm';
import { types, bool } from '../../../../misc/schema';

export const meta = {
	desc: {
		'ja-JP': 'Messagingの履歴を取得します。',
		'en-US': 'Show messaging history.'
	},

	tags: ['messaging'],

	requireCredential: true,

	kind: 'read:messaging',

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		}
	},

	res: {
		type: types.array,
		optional: bool.false, nullable: bool.false,
		items: {
			type: types.object,
			optional: bool.false, nullable: bool.false,
			ref: 'MessagingMessage',
		}
	},
};

export default define(meta, async (ps, user) => {
	const mute = await Mutings.find({
		muterId: user.id,
	});

	const history: MessagingMessage[] = [];

	for (let i = 0; i < ps.limit!; i++) {
		const found = history.map(m => (m.userId === user.id) ? m.recipientId : m.userId);

		const query = MessagingMessages.createQueryBuilder('message')
			.where(new Brackets(qb => { qb
				.where(`message.userId = :userId`, { userId: user.id })
				.orWhere(`message.recipientId = :userId`, { userId: user.id });
			}))
			.orderBy('message.createdAt', 'DESC');

		if (found.length > 0) {
			query.andWhere(`message.userId NOT IN (:...found)`, { found: found });
			query.andWhere(`message.recipientId NOT IN (:...found)`, { found: found });
		}

		if (mute.length > 0) {
			query.andWhere(`message.userId NOT IN (:...mute)`, { mute: mute.map(m => m.muteeId) });
			query.andWhere(`message.recipientId NOT IN (:...mute)`, { mute: mute.map(m => m.muteeId) });
		}

		const message = await query.getOne();

		if (message) {
			history.push(message);
		} else {
			break;
		}
	}

	return await Promise.all(history.map(h => MessagingMessages.pack(h.id, user)));
});
