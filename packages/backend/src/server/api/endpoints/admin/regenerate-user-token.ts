import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UsersRepository } from '@/models/_.js';
import generateUserToken from '@/misc/generate-native-user-token.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:regenerate-user-token',
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
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private globalEventService: GlobalEventService,
		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const user = await this.usersRepository.findOneBy({ id: ps.userId });

			if (user == null) {
				throw new Error('user not found');
			}

			const oldToken = user.token;
			if (oldToken == null) return;

			const newToken = generateUserToken();
			await this.usersRepository.update(user.id, {
				token: newToken,
			});

			// Publish event
			this.globalEventService.publishInternalEvent('userTokenRegenerated', { id: user.id, oldToken, newToken });
			this.globalEventService.publishMainStream(user.id, 'myTokenRegenerated');

			this.moderationLogService.log(me, 'regenerateUserToken', {
				userId: user.id,
				userUsername: user.username,
				userHost: user.host,
			});
		});
	}
}
