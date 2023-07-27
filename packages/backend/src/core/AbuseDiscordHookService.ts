import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { User } from '@/models/entities/User.js';
import { bindThis } from '@/decorators.js';
import type { Config } from '@/config.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';

@Injectable()
export class AbuseDiscordHookService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		private httpRequestService: HttpRequestService,
	) {
	}

	@bindThis
	public send(me: User, user: User, comment: string): void {
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
}
