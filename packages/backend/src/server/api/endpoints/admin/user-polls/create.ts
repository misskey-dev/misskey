/*
 * SPDX-FileCopyrightText: Rickskey Project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { UserPollsRepository, UsersRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';
import { NotificationService } from '@/core/NotificationService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:user-polls',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			id: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
			question: {
				type: 'string',
				optional: false, nullable: false,
			},
			choices: {
				type: 'array',
				optional: false, nullable: false,
				items: { type: 'string' },
			},
			isAnonymous: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			deadline: {
				type: 'string',
				optional: false, nullable: true,
				format: 'date-time',
			},
			isActive: {
				type: 'boolean',
				optional: false, nullable: false,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		question: { type: 'string', minLength: 1, maxLength: 1024 },
		choices: {
			type: 'array',
			items: { type: 'string', minLength: 1, maxLength: 256 },
			minItems: 2,
			maxItems: 10,
		},
		isAnonymous: { type: 'boolean', default: false },
		deadline: { type: 'string', format: 'date-time', nullable: true, default: null },
	},
	required: ['question', 'choices'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.userPollsRepository)
		private userPollsRepository: UserPollsRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private idService: IdService,
		private notificationService: NotificationService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const poll = await this.userPollsRepository.insertOne({
				id: this.idService.gen(),
				createdById: me.id,
				question: ps.question,
				choices: ps.choices,
				isAnonymous: ps.isAnonymous,
				deadline: ps.deadline ? new Date(ps.deadline) : null,
				isActive: true,
			});

			// 全アクティブユーザーに通知を送る
			const users = await this.usersRepository.findBy({
				isDeleted: false,
				isSuspended: false,
				host: null as any,
			});

			for (const user of users) {
				this.notificationService.createNotification(user.id, 'userPoll', {
					pollId: poll.id,
				});
			}

			return {
				id: poll.id,
				question: poll.question,
				choices: poll.choices,
				isAnonymous: poll.isAnonymous,
				deadline: poll.deadline?.toISOString() ?? null,
				isActive: poll.isActive,
			};
		});
	}
}
