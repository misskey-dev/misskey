/*
 * SPDX-FileCopyrightText: yukineko and tai-cat
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NoteNotificationsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { GetterService } from '@/server/api/GetterService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['users'],

	limit: {
		duration: ms('1hour'),
		max: 100,
	},

	requireCredential: true,
	kind: 'write:account',

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'fcd2eef9-a9b2-4c4f-8624-038099e90aa5',
		},

		unsubscribeYourself: {
			message: 'Can\'t unsubscribe yourself.',
			code: 'CANT_UNSUBSCRIBE_YOURSELF',
			id: '079e2610-d53a-41a8-a15a-ed60a178d9a8',
		},

		alreadyUnsubscribed: {
			message: 'You are already unsubscribed that user.',
			code: 'ALREADY_UNSUBSCRIBED',
			id: '158fca64-5c92-4b22-b8b1-93dbe4bcfe60',
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
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// 自分自身
			if (me.id === ps.userId) {
				throw new ApiError(meta.errors.unsubscribeYourself);
			}

			// Get target user
			const target = await this.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
				throw err;
			});

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
		});
	}
}
