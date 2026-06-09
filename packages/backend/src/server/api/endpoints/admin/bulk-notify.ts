/*
 * SPDX-FileCopyrightText: Rickskey Project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import type { UsersRepository, RoleAssignmentsRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { NotificationService } from '@/core/NotificationService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:bulk-notify',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			sentCount: { type: 'number', optional: false, nullable: false },
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		title: { type: 'string', minLength: 1, maxLength: 256 },
		body: { type: 'string', minLength: 1, maxLength: 4096 },
		roleIds: {
			type: 'array',
			items: { type: 'string', format: 'misskey:id' },
			default: [],
		},
		sinceCreatedAt: { type: 'string', format: 'date-time', nullable: true, default: null },
		untilCreatedAt: { type: 'string', format: 'date-time', nullable: true, default: null },
	},
	required: ['title', 'body'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.roleAssignmentsRepository)
		private roleAssignmentsRepository: RoleAssignmentsRepository,

		private notificationService: NotificationService,
	) {
		super(meta, paramDef, async (ps) => {
			// ロールでフィルタするか否か
			let targetUserIds: string[] | null = null;

			if (ps.roleIds && ps.roleIds.length > 0) {
				const assigns = await this.roleAssignmentsRepository.findBy({
					roleId: In(ps.roleIds),
				});
				targetUserIds = [...new Set(assigns.map(a => a.userId))];
				if (targetUserIds.length === 0) return { sentCount: 0 };
			}

			// ユーザークエリ構築
			const query = this.usersRepository.createQueryBuilder('user')
				.where('user.host IS NULL')
				.andWhere('user.isSuspended = false');

			if (targetUserIds != null) {
				query.andWhere('user.id IN (:...ids)', { ids: targetUserIds });
			}

			if (ps.sinceCreatedAt) {
				query.andWhere('user.createdAt >= :since', { since: new Date(ps.sinceCreatedAt) });
			}

			if (ps.untilCreatedAt) {
				query.andWhere('user.createdAt <= :until', { until: new Date(ps.untilCreatedAt) });
			}

			const users = await query.select(['user.id']).getMany();

			for (const user of users) {
				this.notificationService.createNotification(user.id, 'app', {
					appAccessTokenId: null,
					customBody: ps.body,
					customHeader: ps.title,
					customIcon: null,
				});
			}

			return { sentCount: users.length };
		});
	}
}
