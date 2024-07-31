/*
 * SPDX-FileCopyrightText: anatawa12
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { MiAbuseUserReport, MiUser, UsersRepository } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import type { Config } from '@/config.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';

@Injectable()
export class AbuseDiscordHookService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		private httpRequestService: HttpRequestService,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
	) {
	}

	@bindThis
	public send(me: MiUser, user: MiUser, comment: string): void {
		const webhookUrl = this.config.nirila?.abuseDiscordHook;
		if (webhookUrl) {
			setImmediate(async () => {
				const content = 'New abuse report created!\n'
					+ `author: \`@${me.username}${me.host ? `@${me.host}` : ''}\`\n`
					+ `target user: \`@${user.username}${user.host ? `@${user.host}` : ''}\`\n`
					+ 'Comment:\n'
					+ comment;

				await this.httpRequestService.send(webhookUrl, {
					method: 'POST',
					headers: {
						'User-Agent': 'Niri-la-Misskey-Hooks',
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ content }),
				});
			});
		}
	}

	@bindThis
	async sendAll(abuseReports: MiAbuseUserReport[]) {
		const webhookUrl = this.config.nirila?.abuseDiscordHook;
		if (webhookUrl) {
			for (const abuseReport of abuseReports) {
				const reporter = abuseReport.reporter ?? await this.usersRepository.findOneOrFail({ where: { id: abuseReport.reporterId } });
				const targetUser = abuseReport.targetUser ?? await this.usersRepository.findOneOrFail({ where: { id: abuseReport.targetUserId } });
				this.send(reporter, targetUser, abuseReport.comment);
			}
		}
	}
}
