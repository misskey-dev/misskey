import { Inject, Injectable } from '@nestjs/common';
import { publishMainStream } from '@/services/stream.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { MessagingMessages, UserGroupJoinings } from '@/models/index.js';

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
	) {
		super(meta, paramDef, async (ps, me) => {
			// Update documents
			await MessagingMessages.update({
				recipientId: me.id,
				isRead: false,
			}, {
				isRead: true,
			});

			const joinings = await UserGroupJoinings.findBy({ userId: me.id });

			await Promise.all(joinings.map(j => MessagingMessages.createQueryBuilder().update()
				.set({
					reads: (() => `array_append("reads", '${me.id}')`) as any,
				})
				.where('groupId = :groupId', { groupId: j.userGroupId })
				.andWhere('userId != :userId', { userId: me.id })
				.andWhere('NOT (:userId = ANY(reads))', { userId: me.id })
				.execute()));

			publishMainStream(me.id, 'readAllMessagingMessages');
		});
	}
}
