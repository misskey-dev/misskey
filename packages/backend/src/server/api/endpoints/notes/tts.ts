/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Client } from "@gradio/client";
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
		incorrectconfig: {
			message: 'Incorrect configuration.',
			code: 'INCORRECT_CONFIG',
			id: '8d171e60-83b8-11ef-b98c-a7506d6c1de4',
		},
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
		// @ts-ignore
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
				throw new ApiError(meta.errors.cannotConvertInvisibleNote);
			}

			const instance = await this.metaService.fetch();

			if (instance.hfAuthKey == null) {
				throw new ApiError(meta.errors.unavailable);
			}

			let outofQuota;

			if (instance.hfSpace) {
				const langlist = ['Chinese', 'English', 'Japanese', 'Yue', 'Korean', 'Chinese-English Mixed', 'Japanese-English Mixed', 'Yue-English Mixed', 'Korean-English Mixed', 'Multilingual Mixed', 'Multilingual Mixed(Yue)'];
				const slicelist = ['No slice', 'Slice once every 4 sentences', 'Slice per 50 characters', 'Slice by Chinese punct', 'Slice by English punct', 'Slice by every punct'];
				let exampleAudio;
				let app;

				try {
					const example = await fetch(instance.hfexampleAudioURL || '');
					exampleAudio = await example.blob();
				} catch (e) {
					throw new ApiError(meta.errors.unavailable);
				}

				if (((!instance.hfnrm) && (!instance.hfexampleText)) || (!langlist.includes(instance.hfexampleLang || '')) || (!slicelist.includes(instance.hfslice || '')) || (!instance.hfSpaceName) || (!(instance.hfSpeedRate >= 60 && instance.hfSpeedRate <= 165)) || (!(instance.hfTemperature >= 0 && instance.hfTemperature <= 100)) || (!(instance.hftopK >= 0 && instance.hftopK <= 100)) || (!(instance.hftopP >= 0 && instance.hftopP <= 100))) {
					throw new ApiError(meta.errors.incorrectconfig);
				}

				try {
					app = await Client.connect(instance.hfSpaceName, { hf_token: instance.hfAuthKey });
				} catch (e) {
					throw new ApiError(meta.errors.unavailable);
				}

				let result;
				let notcontinue;

				try {
					result = await app.predict("/get_tts_wav", [
						exampleAudio,		
						instance.hfexampleText,	
						instance.hfexampleLang,		
						note.text,
						"Multilingual Mixed",
						instance.hfslice,	
						instance.hftopK,
						instance.hftopP / 100,	
						instance.hfTemperature / 100,
						instance.hfnrm,
						instance.hfSpeedRate / 100,
						instance.hfdas,
					]);
				} catch (e) {
					const responseMessage = (e as any).message || ((e as any).original_msg && (e as any).original_msg.message);

					if (responseMessage && responseMessage.includes('You have exceeded your GPU quota')) {
						outofQuota = true;
						console.info("Fallback to Inference API");
						notcontinue = true;
					} else {
						throw new ApiError(meta.errors.unavailable);
					}
				}

				if (!notcontinue) {
					const resurl = result.data[0].url;

					const res = await this.httpRequestService.send(resurl, {
						method: 'GET',
						headers: {
							'Authorization': 'Bearer ' + instance.hfAuthKey,
						},
						timeout: 60000,
					});

					const contentType = res.headers.get('Content-Type') || 'application/octet-stream';

					if (contentType === 'audio/x-wav') {
						// @ts-ignore
						return res.body;
					} else {
						throw new ApiError(meta.errors.unavailable);
					}
				}
			}

			if ((!instance.hfSpace) || ((instance.hfSpace) && (outofQuota))) {
				const endpoint = 'https://api-inference.huggingface.co/models/suno/bark';

				const res = await this.httpRequestService.send(endpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': 'Bearer ' + instance.hfAuthKey,
						Accept: 'audio/flac, */*',
					},
					body: JSON.stringify({
                    	inputs: note.text,
                	}),
            	    timeout: 60000,
				});

				const contentType = res.headers.get('Content-Type') || 'application/octet-stream';

				if (contentType === 'audio/flac') {
					// @ts-ignore
					return res.body;
				} else {
					throw new ApiError(meta.errors.unavailable);
				}
			}
		});
	}
}
