/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { NoteCreateService } from '@/core/NoteCreateService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import type { UsersRepository, UserProfilesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { NoqestionService } from '@/core/NoqestionService.js';
import { ApiError } from '../../error.js';

/**
 * noq/announce
 * 「質問募集中」ノートを投稿する
 */
export const meta = {
	tags: ['noq'],

	requireCredential: true,

	kind: 'write:notes',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			noteId: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
			success: {
				type: 'boolean',
				optional: false, nullable: false,
			},
		},
	},

	errors: {
		noqDisabled: {
			message: 'Your Noquestion is disabled.',
			code: 'NOQ_DISABLED',
			id: '9f3c1e8a-4b7d-5c6f-8e9a-0b1c2d3e4f5a',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		visibility: { type: 'string', enum: ['public', 'home', 'followers'], default: 'public' },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private noteCreateService: NoteCreateService,
		private noteEntityService: NoteEntityService,
		private noqestionService: NoqestionService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// 質問箱が有効か確認
			const setting = await this.noqestionService.getOrCreateUserSetting(me.id);
			if (!setting.isEnabled) {
				throw new ApiError(meta.errors.noqDisabled);
			}

			// 質問箱URLを生成
			const noqUrl = `${this.config.url}/@${me.username}/noq`;

			// 投稿テキストを生成
			const text = `質問募集中！\n匿名で質問できます！\n\n${noqUrl}\n\n#Noquestion`;

			// ノートを作成
			const note = await this.noteCreateService.create(me, {
				createdAt: new Date(),
				text,
				visibility: ps.visibility ?? 'public',
			});

			return {
				noteId: note.id,
				success: true,
			};
		});
	}
}
