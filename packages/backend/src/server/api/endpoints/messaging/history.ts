import { Inject, Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { MessagingMessage } from '@/models/entities/MessagingMessage.js';
import type { MutingsRepository, UserGroupJoiningsRepository, MessagingMessagesRepository } from '@/models/index.js';
import { MessagingMessageEntityService } from '@/core/entities/MessagingMessageEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['messaging'],

	requireCredential: true,

	kind: 'read:messaging',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'MessagingMessage',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		group: { type: 'boolean', default: false },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.messagingMessagesRepository)
		private messagingMessagesRepository: MessagingMessagesRepository,

		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		@Inject(DI.userGroupJoiningsRepository)
		private userGroupJoiningsRepository: UserGroupJoiningsRepository,

		private messagingMessageEntityService: MessagingMessageEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const mute = await this.mutingsRepository.findBy({
				muterId: me.id,
			});

			const groups = ps.group ? await this.userGroupJoiningsRepository.findBy({
				userId: me.id,
			}).then(xs => xs.map(x => x.userGroupId)) : [];

			if (ps.group && groups.length === 0) {
				return [];
			}

			const history: MessagingMessage[] = [];

			for (let i = 0; i < ps.limit; i++) {
				const found = ps.group
					? history.map(m => m.groupId!)
					: history.map(m => (m.userId === me.id) ? m.recipientId! : m.userId!);

				const query = this.messagingMessagesRepository.createQueryBuilder('message')
					.orderBy('message.createdAt', 'DESC');

				if (ps.group) {
					query.where('message.groupId IN (:...groups)', { groups: groups });

					if (found.length > 0) {
						query.andWhere('message.groupId NOT IN (:...found)', { found: found });
					}
				} else {
					query.where(new Brackets(qb => { qb
						.where('message.userId = :userId', { userId: me.id })
						.orWhere('message.recipientId = :userId', { userId: me.id });
					}));
					query.andWhere('message.groupId IS NULL');

					if (found.length > 0) {
						query.andWhere('message.userId NOT IN (:...found)', { found: found });
						query.andWhere('message.recipientId NOT IN (:...found)', { found: found });
					}

					if (mute.length > 0) {
						query.andWhere('message.userId NOT IN (:...mute)', { mute: mute.map(m => m.muteeId) });
						query.andWhere('message.recipientId NOT IN (:...mute)', { mute: mute.map(m => m.muteeId) });
					}
				}

				const message = await query.getOne();

				if (message) {
					history.push(message);
				} else {
					break;
				}
			}

			return await Promise.all(history.map(h => this.messagingMessageEntityService.pack(h.id, me)));
		});
	}
}
