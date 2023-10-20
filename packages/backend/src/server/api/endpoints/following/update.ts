/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { FollowingsRepository, NoteNotificationsRepository } from '@/models/_.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import { IdService } from '@/core/IdService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { UserBlockingService } from '@/core/UserBlockingService.js';
import { DI } from '@/di-symbols.js';
import { GetterService } from '@/server/api/GetterService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['following', 'users'],

	limit: {
		duration: ms('1hour'),
		max: 100,
	},

	requireCredential: true,

	kind: 'write:following',

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '14318698-f67e-492a-99da-5353a5ac52be',
		},

		followeeIsYourself: {
			message: 'Followee is yourself.',
			code: 'FOLLOWEE_IS_YOURSELF',
			id: '4c4cbaf9-962a-463b-8418-a5e365dbf2eb',
		},

		notFollowing: {
			message: 'You are not following that user.',
			code: 'NOT_FOLLOWING',
			id: 'b8dc75cf-1cb5-46c9-b14b-5f1ffbd782c9',
		},

		alreadySubscribing: {
			message: 'You are already subscribing that user.',
			code: 'ALREADY_SUBSCRIBING',
			id: 'd27c40c9-549b-4590-8df1-871da27076cf',
		},

		alreadyUnsubscribed: {
			message: 'You are already unsubscribed that user.',
			code: 'ALREADY_UNSUBSCRIBED',
			id: '158fca64-5c92-4b22-b8b1-93dbe4bcfe60',
		},

		blocking: {
			message: 'You are blocking that user.',
			code: 'BLOCKING',
			id: '4e2206ec-aa4f-4960-b865-6c23ac38e2d9',
		},

		blocked: {
			message: 'You are blocked by that user.',
			code: 'BLOCKED',
			id: 'c4ab57cc-4e41-45e9-bfd9-584f61e35ce0',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'UserLite',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
		notify: { type: 'string', enum: ['normal', 'none'] },
		withReplies: { type: 'boolean' },
	},
	required: ['userId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,
		@Inject(DI.noteNotificationsRepository)
		private noteNotificationRepository: NoteNotificationsRepository,

		private userEntityService: UserEntityService,
		private getterService: GetterService,
		private userFollowingService: UserFollowingService,
		private userBlockingService: UserBlockingService,
		private idService: IdService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const follower = me;

			// Check if the follower is yourself
			if (me.id === ps.userId) {
				throw new ApiError(meta.errors.followeeIsYourself);
			}

			// Get target user
			const target = await this.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
				throw err;
			});

			// Find and update followingsRepository
			const exist = await this.followingsRepository.findOneBy({
				followerId: follower.id,
				followeeId: target.id,
			});

			if (exist) {
				await this.followingsRepository.update({
					id: exist.id,
				}, {
					notify: ps.notify != null ? (ps.notify === 'none' ? null : ps.notify) : undefined,
					withReplies: ps.withReplies ?? undefined,
				});
			}

			// To subscribe
			if (ps.notify === 'normal') {
				// Check if already subscribing
				const exist = await this.noteNotificationRepository.findOneBy({
					userId: me.id,
					targetUserId: target.id,
				});

				if (exist != null) {
					throw new ApiError(meta.errors.alreadySubscribing);
				}

				// Check if blocking
				if (await this.userBlockingService.checkBlocked(me.id, target.id)) {
					throw new ApiError(meta.errors.blocking);
				}

				// Check if blocked
				if (await this.userBlockingService.checkBlocked(target.id, me.id)) {
					throw new ApiError(meta.errors.blocked);
				}

				// Create
				const noteNotification = await this.noteNotificationRepository.insert({
					id: this.idService.gen(),
					userId: me.id,
					targetUserId: target.id,
				}).then(x => this.noteNotificationRepository.findOneByOrFail(x.identifiers[0]));

				// Publish event
				this.globalEventService.publishInternalEvent('noteNotificationCreated', noteNotification);
			} else {
				// Check if already unsubscribed
				const noteNotification = await this.noteNotificationRepository.findOneBy({
					userId: me.id,
					targetUserId: target.id,
				});

				if (!noteNotification) {
					throw new ApiError(meta.errors.alreadyUnsubscribed);
				}

				// Delete
				await this.noteNotificationRepository.delete({
					userId: me.id,
					targetUserId: target.id,
				});

				// Publish event
				this.globalEventService.publishInternalEvent('noteNotificationDeleted', noteNotification);
			}

			return await this.userEntityService.pack(follower.id, me);
		});
	}
}
