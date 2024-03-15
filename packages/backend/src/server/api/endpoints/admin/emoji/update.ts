/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { CustomEmojiService } from '@/core/CustomEmojiService.js';
import type { DriveFilesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireRolePolicy: 'canManageCustomEmojis',
	kind: 'write:admin:emoji',

	errors: {
		noSuchEmoji: {
			message: 'No such emoji.',
			code: 'NO_SUCH_EMOJI',
			id: '684dec9d-a8c2-4364-9aa8-456c49cb1dc8',
		},
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: '14fb9fd9-0731-4e2f-aeb9-f09e4740333d',
		},
		sameNameEmojiExists: {
			message: 'Emoji that have same name already exists.',
			code: 'SAME_NAME_EMOJI_EXISTS',
			id: '7180fe9d-1ee3-bff9-647d-fe9896d2ffb8',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		id: { type: 'string', format: 'misskey:id' },
		name: { type: 'string', pattern: '^[a-zA-Z0-9_]+$' },
		fileId: { type: 'string', format: 'misskey:id' },
		category: {
			type: 'string',
			nullable: true,
			description: 'Use `null` to reset the category.',
		},
		aliases: { type: 'array', items: {
			type: 'string',
		} },
		license: { type: 'string', nullable: true },
		isSensitive: { type: 'boolean' },
		localOnly: { type: 'boolean' },
		roleIdsThatCanBeUsedThisEmojiAsReaction: { type: 'array', items: {
			type: 'string',
		} },
	},
	required: ['id', 'name', 'aliases'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private customEmojiService: CustomEmojiService,
	) {
		super(meta, paramDef, async (ps, me) => {
			let driveFile;

			if (ps.fileId) {
				driveFile = await this.driveFilesRepository.findOneBy({ id: ps.fileId });
				if (driveFile == null) throw new ApiError(meta.errors.noSuchFile);
			}
			const emoji = await this.customEmojiService.getEmojiById(ps.id);
			if (emoji != null) {
				if (ps.name !== emoji.name) {
					const isDuplicate = await this.customEmojiService.checkDuplicate(ps.name);
					if (isDuplicate) throw new ApiError(meta.errors.sameNameEmojiExists);
				}
			} else {
				throw new ApiError(meta.errors.noSuchEmoji);
			}

			await this.customEmojiService.update(ps.id, {
				driveFile,
				name: ps.name,
				category: ps.category ?? null,
				aliases: ps.aliases,
				license: ps.license ?? null,
				isSensitive: ps.isSensitive,
				localOnly: ps.localOnly,
				roleIdsThatCanBeUsedThisEmojiAsReaction: ps.roleIdsThatCanBeUsedThisEmojiAsReaction,
			}, me);
		});
	}
}
