/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { MetaService } from '@/core/MetaService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import type { UsersRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';

/**
 * admin/noq/settings
 * Noqestion（匿名質問箱）の管理者設定を取得
 */
export const meta = {
	tags: ['admin', 'noq'],

	requireCredential: true,
	requireModerator: true,
	secure: true,
	kind: 'read:admin:noq',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			noqBotAccountId: {
				type: 'string',
				optional: false, nullable: true,
				format: 'id',
			},
			noqBotAccountUsername: {
				type: 'string',
				optional: false, nullable: true,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private metaService: MetaService,
		private userEntityService: UserEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const instance = await this.metaService.fetch(true);

			let noqBotAccountUsername: string | null = null;

			if (instance.noqBotAccountId) {
				const botAccount = await this.usersRepository.findOneBy({
					id: instance.noqBotAccountId,
				});
				if (botAccount) {
					noqBotAccountUsername = botAccount.username;
				}
			}

			return {
				noqBotAccountId: instance.noqBotAccountId,
				noqBotAccountUsername,
			};
		});
	}
}
