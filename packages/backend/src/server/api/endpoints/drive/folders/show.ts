/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { IEndpointMeta } from '@/server/api/endpoints.js';
import type { Schema } from '@/misc/json-schema.js';
import type { DriveFoldersRepository } from '@/models/_.js';
import { DriveFolderEntityService } from '@/core/entities/DriveFolderEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'read:drive',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'DriveFolder',
	},

	errors: {
		noSuchFolder: {
			message: 'No such folder.',
			code: 'NO_SUCH_FOLDER',
			id: 'd74ab9eb-bb09-4bba-bf24-fb58f761e1e9',
		},
	},
} as const satisfies IEndpointMeta;

export const paramDef = {
	type: 'object',
	properties: {
		folderId: { type: 'string', format: 'misskey:id' },
	},
	required: ['folderId'],
} as const satisfies Schema;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.driveFoldersRepository)
		private driveFoldersRepository: DriveFoldersRepository,

		private driveFolderEntityService: DriveFolderEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Get folder
			const folder = await this.driveFoldersRepository.findOneBy({
				id: ps.folderId,
				userId: me.id,
			});

			if (folder == null) {
				throw new ApiError(meta.errors.noSuchFolder);
			}

			return await this.driveFolderEntityService.pack(folder, {
				detail: true,
			});
		});
	}
}
