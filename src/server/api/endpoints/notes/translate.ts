import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { getNote } from '../../common/getters';
import { ApiError } from '../../error';
import fetch from 'node-fetch';
import config from '@/config/index';
import { getAgentByUrl } from '@/misc/fetch';
import { URLSearchParams } from 'url';
import { fetchMeta } from '@/misc/fetch-meta';
import { Notes } from '@/models';

export const meta = {
	tags: ['notes'],

	requireCredential: false as const,

	params: {
		noteId: {
			validator: $.type(ID),
		},
		targetLang: {
			validator: $.str,
		},
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'bea9b03f-36e0-49c5-a4db-627a029f8971'
		}
	}
};

export default define(meta, async (ps, user) => {
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
			Accept: 'application/json, */*'
		},
		body: params,
		timeout: 10000,
		agent: getAgentByUrl,
	});

	const json = await res.json();

	return {
		sourceLang: json.translations[0].detected_source_language,
		text: json.translations[0].text
	};
});
