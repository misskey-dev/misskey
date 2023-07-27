/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { EmojisRepository } from '@/models/index.js';
import { IdService } from '@/core/IdService.js';
import type { DriveFile } from '@/models/entities/DriveFile.js';
import { DI } from '@/di-symbols.js';
import { DriveService } from '@/core/DriveService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { EmojiEntityService } from '@/core/entities/EmojiEntityService.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireRolePolicy: 'canManageCustomEmojis',

	errors: {
		noSuchEmoji: {
			message: 'No such emoji.',
			code: 'NO_SUCH_EMOJI',
			id: 'e2785b66-dca3-4087-9cac-b93c541cc425',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			id: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		emojiId: { type: 'string', format: 'misskey:id' },
	},
	required: ['emojiId'],
} as const;

// TODO: ロジックをサービスに切り出す

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.emojisRepository)
		private emojisRepository: EmojisRepository,

		private emojiEntityService: EmojiEntityService,
		private idService: IdService,
		private globalEventService: GlobalEventService,
		private driveService: DriveService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const emoji = await this.emojisRepository.findOneBy({ id: ps.emojiId });

			if (emoji == null) {
				throw new ApiError(meta.errors.noSuchEmoji);
			}

			let driveFile: DriveFile;

			try {
				// Create file
				driveFile = await this.driveService.uploadFromUrl({ url: emoji.originalUrl, user: null, force: true });
			} catch (e) {
				throw new ApiError();
			}

			const copied = await this.emojisRepository.insert({
				id: this.idService.genId(),
				updatedAt: new Date(),
				name: emoji.name,
				host: null,
				aliases: [],
				originalUrl: driveFile.url,
				publicUrl: driveFile.webpublicUrl ?? driveFile.url,
				type: driveFile.webpublicType ?? driveFile.type,
				license: emoji.license,
			}).then(x => this.emojisRepository.findOneByOrFail(x.identifiers[0]));

			this.globalEventService.publishBroadcastStream('emojiAdded', {
				emoji: await this.emojiEntityService.packDetailed(copied.id),
			});

			return {
				id: copied.id,
			};
		});
	}
}
