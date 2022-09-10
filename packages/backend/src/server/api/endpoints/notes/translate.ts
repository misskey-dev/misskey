import { URLSearchParams } from 'node:url';
import fetch from 'node-fetch';
import { Inject, Injectable } from '@nestjs/common';
import config from '@/config/index.js';
import { getAgentByUrl } from '@/misc/fetch.js';
import { fetchMeta } from '@/misc/fetch-meta.js';
import { Notes } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '../../error.js';
import { getNote } from '../../common/getters.js';

export const meta = {
	tags: ['notes'],

	requireCredential: false,

	res: {
		type: 'object',
		optional: false, nullable: false,
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'bea9b03f-36e0-49c5-a4db-627a029f8971',
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

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('usersRepository')
    private usersRepository: typeof Users,

		@Inject('notesRepository')
    private notesRepository: typeof Notes,
	) {
		super(meta, paramDef, async (ps, user) => {
			const note = await getNote(ps.noteId).catch(e => {
				if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
				throw e;
			});

			if (!(await Notes.isVisibleForMe(note, user ? user.id : null))) {
				return 204; // TODO: 良い感じのエラー返す
			}

			if (note.text == null) {
				return 204;
			}

			const instance = await fetchMeta();

			if (instance.deeplAuthKey == null) {
				return 204; // TODO: 良い感じのエラー返す
			}

			let targetLang = ps.targetLang;
			if (targetLang.includes('-')) targetLang = targetLang.split('-')[0];

			const params = new URLSearchParams();
			params.append('auth_key', instance.deeplAuthKey);
			params.append('text', note.text);
			params.append('target_lang', targetLang);

			const endpoint = instance.deeplIsPro ? 'https://api.deepl.com/v2/translate' : 'https://api-free.deepl.com/v2/translate';

			const res = await fetch(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'User-Agent': config.userAgent,
					Accept: 'application/json, */*',
				},
				body: params,
				// TODO
				//timeout: 10000,
				agent: getAgentByUrl,
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
}
