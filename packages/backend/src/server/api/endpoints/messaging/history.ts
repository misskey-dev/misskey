import $ from 'cafy';
import define from '../../define';
import { MessagingMessage } from '@/models/entities/messaging-message';
import { MessagingMessages, Mutings, UserGroupJoinings } from '@/models/index';
import { Brackets } from 'typeorm';

export const meta = {
	tags: ['messaging'],

	requireCredential: true as const,

	kind: 'read:messaging',

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10,
		},

		group: {
			validator: $.optional.bool,
			default: false,
		},
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'MessagingMessage',
		},
	},
};

export default define(meta, async (ps, user) => {
	const mute = await Mutings.find({
		muterId: user.id,
	});

	const groups = ps.group ? await UserGroupJoinings.find({
		userId: user.id,
	}).then(xs => xs.map(x => x.userGroupId)) : [];

	if (ps.group && groups.length === 0) {
		return [];
	}

	const history: MessagingMessage[] = [];

	for (let i = 0; i < ps.limit!; i++) {
		const found = ps.group
			? history.map(m => m.groupId!)
			: history.map(m => (m.userId === user.id) ? m.recipientId! : m.userId!);

		const query = MessagingMessages.createQueryBuilder('message')
			.orderBy('message.createdAt', 'DESC');

		if (ps.group) {
			query.where(`message.groupId IN (:...groups)`, { groups: groups });

			if (found.length > 0) {
				query.andWhere(`message.groupId NOT IN (:...found)`, { found: found });
			}
		} else {
			query.where(new Brackets(qb => { qb
				.where(`message.userId = :userId`, { userId: user.id })
				.orWhere(`message.recipientId = :userId`, { userId: user.id });
			}));
			query.andWhere(`message.groupId IS NULL`);

			if (found.length > 0) {
				query.andWhere(`message.userId NOT IN (:...found)`, { found: found });
				query.andWhere(`message.recipientId NOT IN (:...found)`, { found: found });
			}

			if (mute.length > 0) {
				query.andWhere(`message.userId NOT IN (:...mute)`, { mute: mute.map(m => m.muteeId) });
				query.andWhere(`message.recipientId NOT IN (:...mute)`, { mute: mute.map(m => m.muteeId) });
			}
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
