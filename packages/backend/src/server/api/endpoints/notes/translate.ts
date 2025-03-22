/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { URLSearchParams } from 'node:url';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { GetterService } from '@/server/api/GetterService.js';
import { RoleService } from '@/core/RoleService.js';
import { ApiError } from '../../error.js';
import { MiMeta } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { OpenAI } from "openai";
import * as Redis from 'ioredis';

export const meta = {
	tags: ['notes'],

	requireCredential: true,
	kind: 'read:account',

	res: {
		type: 'object',
		optional: true, nullable: false,
		properties: {
			sourceLang: { type: 'string' },
			text: { type: 'string' },
		},
	},

	errors: {
		unavailable: {
			message: 'Translate of notes unavailable.',
			code: 'UNAVAILABLE',
			id: '50a70314-2d8a-431b-b433-efa5cc56444c',
		},
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'bea9b03f-36e0-49c5-a4db-627a029f8971',
		},
		cannotTranslateInvisibleNote: {
			message: 'Cannot translate invisible note.',
			code: 'CANNOT_TRANSLATE_INVISIBLE_NOTE',
			id: 'ea29f2ca-c368-43b3-aaf1-5ac3e74bbe5d',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
		targetLang: { type: 'string' },
	},
	required: ['noteId', 'targetLang'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.meta)
		private serverSettings: MiMeta,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		private noteEntityService: NoteEntityService,
		private getterService: GetterService,
		private httpRequestService: HttpRequestService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const policies = await this.roleService.getUserPolicies(me.id);
			if (!policies.canUseTranslator) {
				throw new ApiError(meta.errors.unavailable);
			}

			const note = await this.getterService.getNote(ps.noteId).catch(err => {
				if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
				throw err;
			});

			if (!(await this.noteEntityService.isVisibleForMe(note, me.id))) {
				throw new ApiError(meta.errors.cannotTranslateInvisibleNote);
			}

			if (note.text == null) {
				return;
			}

			if (this.serverSettings.enableLlmTranslator) {
				const res = await this.llmTranslate(note.text, ps.targetLang, note.id);
				return {
					text: res,
				}
			}

			if (this.serverSettings.deeplAuthKey == null) {
				throw new ApiError(meta.errors.unavailable);
			}

			let targetLang = ps.targetLang;
			if (targetLang.includes('-')) targetLang = targetLang.split('-')[0];

			const params = new URLSearchParams();
			params.append('auth_key', this.serverSettings.deeplAuthKey);
			params.append('text', note.text);
			params.append('target_lang', targetLang);

			const endpoint = this.serverSettings.deeplIsPro ? 'https://api.deepl.com/v2/translate' : 'https://api-free.deepl.com/v2/translate';

			const res = await this.httpRequestService.send(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					Accept: 'application/json, */*',
				},
				body: params.toString(),
			});

			const json = (await res.json()) as {
				translations: {
					detected_source_language: string;
					text: string;
				}[];
			};

			return {
				sourceLang: json.translations[0].detected_source_language,
				text: json.translations[0].text,
			};
		});
	}

	private async llmTranslate(text: string, targetLang: string, noteId: string): Promise<string | null> {
		if (this.serverSettings.enableLlmTranslatorRedisCache) {
			const key = `llmTranslate:${targetLang}:${noteId}`;
			const cached = await this.redisClient.get(key);
			if (cached != null) {
				this.redisClient.expire(key, this.serverSettings.llmTranslatorRedisCacheTtl*60);
				return cached;
			}
			const res = await this.getLlmRes(text, targetLang);
			await this.redisClient.set(key, res ?? '');
			this.redisClient.expire(key, this.serverSettings.llmTranslatorRedisCacheTtl*60);
			return res;
		}
		else {
			return this.getLlmRes(text, targetLang);
		}
	}


	private async getLlmRes(text: string, targetLang: string): Promise<string | null> {
		const client = new OpenAI({
			baseURL: this.serverSettings.llmTranslatorBaseUrl,
			apiKey: this.serverSettings.llmTranslatorApiKey ?? '',
		});
		const message = [];
		if (this.serverSettings.llmTranslatorSysPrompt) {
			message.push({ role: 'system' as const, content: this.serverSettings.llmTranslatorSysPrompt.replace('{targetLang}', targetLang).replace('{text}', text) });
		}
		if (this.serverSettings.llmTranslatorUserPrompt) {
			message.push({ role: 'user' as const, content: this.serverSettings.llmTranslatorUserPrompt.replace('{targetLang}', targetLang).replace('{text}', text) });
		}
		const completion = await client.chat.completions.create({
			messages: message,
			model: this.serverSettings.llmTranslatorModel ?? '',
			temperature: this.serverSettings.llmTranslatorTemperature,
			max_tokens: this.serverSettings.llmTranslatorMaxTokens,
			top_p: this.serverSettings.llmTranslatorTopP,
		})

		return completion.choices[0].message.content
	}
}
