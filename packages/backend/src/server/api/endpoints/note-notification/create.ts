/*
 * SPDX-FileCopyrightText: yukineko and tai-cat
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NoteNotificationsRepository } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { UserBlockingService } from '@/core/UserBlockingService.js';
import { DI } from '@/di-symbols.js';
import { GetterService } from '@/server/api/GetterService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['users'],

	limit: {
		duration: ms('1hour'),
		max: 100,
	},

	requireCredential: true,
	requireAdmin: false,
	kind: 'write:account',

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'fcd2eef9-a9b2-4c4f-8624-038099e90aa5',
		},

		subscribeYourself: {
			message: 'Can\'t subscribe yourself.',
			code: 'CANT_SUBSCRIBE_YOURSELF',
			id: '1d1ad949-15cc-4896-803d-3410f716f88b',
		},

		alreadySubscribing: {
			message: 'You are already subscribing that user.',
			code: 'ALREADY_SUBSCRIBING',
			id: 'd27c40c9-549b-4590-8df1-871da27076cf',
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
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.noteNotificationsRepository)
		private noteNotificationRepository: NoteNotificationsRepository,

		private getterService: GetterService,
		private userBlockingService: UserBlockingService,
		private idService: IdService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// 自分自身
			if (me.id === ps.userId) {
				throw new ApiError(meta.errors.subscribeYourself);
			}

			// Get target user
			const target = await this.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
				throw err;
			});

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
		});
	}
}
