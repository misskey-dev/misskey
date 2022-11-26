import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { MessagingMessagesRepository, UserGroupJoiningsRepository } from '@/models/index.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['account', 'messaging'],

	requireCredential: true,

	kind: 'write:account',
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.messagingMessagesRepository)
		private messagingMessagesRepository: MessagingMessagesRepository,

		@Inject(DI.userGroupJoiningsRepository)
		private userGroupJoiningsRepository: UserGroupJoiningsRepository,

		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Update documents
			await this.messagingMessagesRepository.update({
				recipientId: me.id,
				isRead: false,
			}, {
				isRead: true,
			});

			const joinings = await this.userGroupJoiningsRepository.findBy({ userId: me.id });

			await Promise.all(joinings.map(j => this.messagingMessagesRepository.createQueryBuilder().update()
				.set({
					reads: (() => `array_append("reads", '${me.id}')`) as any,
				})
				.where('groupId = :groupId', { groupId: j.userGroupId })
				.andWhere('userId != :userId', { userId: me.id })
				.andWhere('NOT (:userId = ANY(reads))', { userId: me.id })
				.execute()));

			this.globalEventService.publishMainStream(me.id, 'readAllMessagingMessages');
		});
	}
}
