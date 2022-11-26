import { Inject, Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UsersRepository, UserGroupsRepository, MessagingMessagesRepository, UserGroupJoiningsRepository } from '@/models/index.js';
import { QueryService } from '@/core/QueryService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { MessagingMessageEntityService } from '@/core/entities/MessagingMessageEntityService.js';
import { MessagingService } from '@/core/MessagingService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';
import { GetterService } from '@/server/api/GetterService.js';

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

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '11795c64-40ea-4198-b06e-3c873ed9039d',
		},

		noSuchGroup: {
			message: 'No such group.',
			code: 'NO_SUCH_GROUP',
			id: 'c4d9f88c-9270-4632-b032-6ed8cee36f7f',
		},

		groupAccessDenied: {
			message: 'You can not read messages of groups that you have not joined.',
			code: 'GROUP_ACCESS_DENIED',
			id: 'a053a8dd-a491-4718-8f87-50775aad9284',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		markAsRead: { type: 'boolean', default: true },
	},
	anyOf: [
		{
			properties: {
				userId: { type: 'string', format: 'misskey:id' },
			},
			required: ['userId'],
		},
		{
			properties: {
				groupId: { type: 'string', format: 'misskey:id' },
			},
			required: ['groupId'],
		},
	],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.messagingMessagesRepository)
		private messagingMessagesRepository: MessagingMessagesRepository,

		@Inject(DI.userGroupsRepository)
		private userGroupRepository: UserGroupsRepository,

		@Inject(DI.userGroupJoiningsRepository)
		private userGroupJoiningsRepository: UserGroupJoiningsRepository,

		private messagingMessageEntityService: MessagingMessageEntityService,
		private messagingService: MessagingService,
		private userEntityService: UserEntityService,
		private queryService: QueryService,
		private getterService: GetterService,
	) {
		super(meta, paramDef, async (ps, me) => {
			if (ps.userId != null) {
				// Fetch recipient (user)
				const recipient = await this.getterService.getUser(ps.userId).catch(err => {
					if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
					throw err;
				});

				const query = this.queryService.makePaginationQuery(this.messagingMessagesRepository.createQueryBuilder('message'), ps.sinceId, ps.untilId)
					.andWhere(new Brackets(qb => { qb
						.where(new Brackets(qb => { qb
							.where('message.userId = :meId')
							.andWhere('message.recipientId = :recipientId');
						}))
						.orWhere(new Brackets(qb => { qb
							.where('message.userId = :recipientId')
							.andWhere('message.recipientId = :meId');
						}));
					}))
					.setParameter('meId', me.id)
					.setParameter('recipientId', recipient.id);

				const messages = await query.take(ps.limit).getMany();

				// Mark all as read
				if (ps.markAsRead) {
					this.messagingService.readUserMessagingMessage(me.id, recipient.id, messages.filter(m => m.recipientId === me.id).map(x => x.id));

					// リモートユーザーとのメッセージだったら既読配信
					if (this.userEntityService.isLocalUser(me) && this.userEntityService.isRemoteUser(recipient)) {
						this.messagingService.deliverReadActivity(me, recipient, messages);
					}
				}

				return await Promise.all(messages.map(message => this.messagingMessageEntityService.pack(message, me, {
					populateRecipient: false,
				})));
			} else if (ps.groupId != null) {
				// Fetch recipient (group)
				const recipientGroup = await this.userGroupRepository.findOneBy({ id: ps.groupId });

				if (recipientGroup == null) {
					throw new ApiError(meta.errors.noSuchGroup);
				}

				// check joined
				const joining = await this.userGroupJoiningsRepository.findOneBy({
					userId: me.id,
					userGroupId: recipientGroup.id,
				});

				if (joining == null) {
					throw new ApiError(meta.errors.groupAccessDenied);
				}

				const query = this.queryService.makePaginationQuery(this.messagingMessagesRepository.createQueryBuilder('message'), ps.sinceId, ps.untilId)
					.andWhere('message.groupId = :groupId', { groupId: recipientGroup.id });

				const messages = await query.take(ps.limit).getMany();

				// Mark all as read
				if (ps.markAsRead) {
					this.messagingService.readGroupMessagingMessage(me.id, recipientGroup.id, messages.map(x => x.id));
				}

				return await Promise.all(messages.map(message => this.messagingMessageEntityService.pack(message, me, {
					populateGroup: false,
				})));
			}
		});
	}
}
