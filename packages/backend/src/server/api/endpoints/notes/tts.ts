/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { MetaService } from '@/core/MetaService.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { GetterService } from '@/server/api/GetterService.js';
import { RoleService } from '@/core/RoleService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,
	kind: 'read:account',

	res: {
		type: 'string',
		optional: true, nullable: false,
		contentMediaType: 'audio/flac',
	},

	errors: {
		unavailable: {
			message: 'Convert of notes unavailable.',
			code: 'UNAVAILABLE',
			id: '97a0826c-6393-11ef-a650-67972d710975',
		},
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'bea9b03f-36e0-49c5-a4db-627a029f8971',
		},
		cannotConvertInvisibleNote: {
			message: 'Cannot convert invisible note.',
			code: 'CANNOT_CONVERT_INVISIBLE_NOTE',
			id: 'f57caae0-6394-11ef-8e2a-d706932c1030',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
	},
	required: ['noteId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private noteEntityService: NoteEntityService,
		private getterService: GetterService,
		private metaService: MetaService,
		private httpRequestService: HttpRequestService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const policies = await this.roleService.getUserPolicies(me.id);
			if (!policies.canUseTTS) {
				throw new ApiError(meta.errors.unavailable);
			}

			const note = await this.getterService.getNote(ps.noteId).catch(err => {
				if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
				throw err;
			});

			if (!(await this.noteEntityService.isVisibleForMe(note, me.id))) {
				throw new ApiError(meta.errors.cannotConvertInvisibleNote);
			}

			if (note.text == null) {
				return;
			}

			const instance = await this.metaService.fetch();

			if (instance.hfAuthKey == null) {
				throw new ApiError(meta.errors.unavailable);
			}

			const endpoint = 'https://api-inference.huggingface.co/models/suno/bark';

			const res = await this.httpRequestService.send(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + instance.hfAuthKey,
				},
				body: JSON.stringify({
                    inputs: note.text,
                }),
                timeout: 60000,
			});

			let contentType = res.headers.get('content-type') || 'application/octet-stream';

			if (res.headers.get('content-type') === 'audio/flac') {
                return {
					body: res.body,
					headers: {
						'Content-Type': contentType,
					}
				};
            } else {
                throw new ApiError(meta.errors.unavailable);
            }
		});
	}
}
