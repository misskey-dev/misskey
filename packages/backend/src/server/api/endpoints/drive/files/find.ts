/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DriveFilesRepository } from '@/models/_.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	requireCredential: true,

	tags: ['drive'],

	kind: 'read:drive',

	description: 'Search for a drive file by the given parameters.',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'DriveFile',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		folderId: { type: 'string', format: 'misskey:id', nullable: true, default: null },
	},
	required: ['name'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveFileEntityService: DriveFileEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const files = await this.driveFilesRepository.findBy({
				name: ps.name,
				userId: me.id,
				folderId: ps.folderId ?? IsNull(),
			});

			return await Promise.all(files.map(file => this.driveFileEntityService.pack(file, { self: true })));
		});
	}
}
