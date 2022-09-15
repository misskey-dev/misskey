import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { MessagingMessages, UserGroupJoinings } from '@/models/index.js';
import { GlobalEventService } from '@/services/GlobalEventService.js';

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
		@Inject('messagingMessagesRepository')
		private messagingMessagesRepository: typeof MessagingMessages,

		@Inject('userGroupJoinings')
		private userGroupJoinings: typeof UserGroupJoinings,

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

			const joinings = await this.userGroupJoinings.findBy({ userId: me.id });

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
