import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { CustomEmojiService } from '@/core/CustomEmojiService.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import type { EmojisRepository } from '@/models/index.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireRolePolicy: 'canManageCustomEmojis',

	errors: {
		noSuchEmoji: {
			message: 'No such emoji.',
			code: 'NO_SUCH_EMOJI',
			id: 'be83669b-773a-44b7-b1f8-e5e5170ac3c2',
		},
		notOwnerOrpermissionDenied: {
			message: 'You are not this emoji owner or not assigned to a required role.',
			code: 'NOT_OWNER_OR_PERMISSION_DENIED',
			id: '73952b00-d3e3-4038-b2c6-f4b4532e3906'
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		id: { type: 'string', format: 'misskey:id' },
	},
	required: ['id'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		private customEmojiService: CustomEmojiService,

		@Inject(DI.emojisRepository)
		private emojisRepository: EmojisRepository,

		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const oldEmoji = await this.emojisRepository.findOneBy({
				id: ps.id,
			});

			if (oldEmoji == null) throw new ApiError(meta.errors.noSuchEmoji);

			const isEmojiModerator = await this.roleService.isEmojiModerator(me);

			if (!isEmojiModerator && oldEmoji.userId !== me.id) {
				throw new ApiError(meta.errors.notOwnerOrpermissionDenied);
			}

			await this.customEmojiService.delete(ps.id, me.id);
		});
	}
}
