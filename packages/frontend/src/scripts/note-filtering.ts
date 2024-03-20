/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { i18n } from '@/i18n.js';

type NoteMutingValidatorResponse = {
	shouldMute: true;
	/** ソフトミュートの際に使用される文言（例:「〇〇さんの何々」） */
	reason: string;
} | {
	shouldMute: false;
};

type NoteMutingFactorDefinition = {
	/** 消す対象物（「`ruleName`のノートをフィルタリングする」に当てはめて考えるとわかりやすい） */
	ruleName: string;

	/** 有効にした際にruleNameの対象物が消えるようなバリデーション関数を書く */
	validate: (note: Misskey.entities.Note) => NoteMutingValidatorResponse;
};

/**
 * Represents a NoteFilter that filters notes based on muting factors.
 *
 * （型定義をよしなにするためにclassにしてある）
 * @template T - The definitions of muting factor.
 */
class NoteFilter<T extends Record<string, NoteMutingFactorDefinition>> {
	public readonly factors: T;
	public readonly factorKeys: (keyof T)[];

	/**
	 * Creates a new NoteFilter instance.
	 * @param factors - The muting factors to be used for filtering.
	 */
	constructor(factors: T) {
		this.factors = factors;
		this.factorKeys = Object.keys(factors) as (keyof T)[];
	}

	/**
	 * Filters a note based on the muting factors.
	 * @param note - The note to be filtered.
	 * @param useFactor - Optional. The specific muting factors to be used for filtering.
	 * @returns The result of the muting validation.
	 */
	public filter(note: Misskey.entities.Note, useFactor?: (keyof T)[]): NoteMutingValidatorResponse {
		for (const [key, factor] of Object.entries(this.factors)) {
			if (useFactor && !useFactor.includes(key as keyof T)) {
				continue;
			}

			const result = factor.validate(note);
			if (result.shouldMute) {
				return result;
			}
		}
		return {
			shouldMute: false,
		};
	}
}

export const defaultNoteFilter = new NoteFilter({
	filterRenotes: {
		ruleName: 'リノート',
		validate: (note) => {
			if (note.renoteId && !note.text) {
				return {
					shouldMute: true,
					reason: '',
				};
			} else {
				return {
					shouldMute: false,
				};
			}
		},
	},
	filterQuotes: {
		ruleName: '引用',
		validate: (note) => {
			if (note.renoteId && note.text && note.text !== '') {
				return {
					shouldMute: true,
					reason: '',
				};
			} else {
				return {
					shouldMute: false,
				};
			}
		},
	},
	filterReplies: {
		ruleName: '返信',
		validate: (note) => {
			if (note.replyId) {
				return {
					shouldMute: true,
					reason: '',
				};
			} else {
				return {
					shouldMute: false,
				};
			}
		},
	},
	filterSensitiveFileAttached: {
		ruleName: 'センシティブなファイル付き',
		validate: (note) => {
			if (note.files && note.files.length > 0 && note.files.some(file => file.isSensitive)) {
				return {
					shouldMute: true,
					reason: '',
				};
			} else {
				return {
					shouldMute: false,
				};
			}
		},
	},
	filterCw: {
		ruleName: '「内容を隠す」付き',
		validate: (note) => {
			if (note.cw) {
				return {
					shouldMute: true,
					reason: '',
				};
			} else {
				return {
					shouldMute: false,
				};
			}
		},
	},
	filterTextOnly: {
		ruleName: 'ファイルなし',
		validate: (note) => {
			if (!note.files || note.files.length === 0) {
				return {
					shouldMute: true,
					reason: '',
				};
			} else {
				return {
					shouldMute: false,
				};
			}
		},
	},
	filterBot: {
		ruleName: 'Botのノート',
		validate: (note) => {
			if (note.user.isBot) {
				return {
					shouldMute: true,
					reason: '',
				};
			} else {
				return {
					shouldMute: false,
				};
			}
		},
	},
	filterLocal: {
		ruleName: 'このサーバーのノート',
		validate: (note) => {
			if (!note.user.host) {
				return {
					shouldMute: true,
					reason: '',
				};
			} else {
				return {
					shouldMute: false,
				};
			}
		},
	},
	filterOutbound: {
		ruleName: '外部サーバーのノート',
		validate: (note) => {
			if (note.user.host) {
				return {
					shouldMute: true,
					reason: '',
				};
			} else {
				return {
					shouldMute: false,
				};
			}
		},
	},
});

export const tlNoteFilterAvailableSettingsList = {
	home: [
		'filterRenotes',
		'filterQuotes',
		'filterSensitiveFileAttached',
		'filterCw',
		'filterTextOnly',
	],
	local: [
		'filterRenotes',
		'filterQuotes',
		'filterReplies',
		'filterSensitiveFileAttached',
		'filterCw',
		'filterTextOnly',
		'filterBot',
	],
	social: [
		'filterRenotes',
		'filterQuotes',
		'filterReplies',
		'filterSensitiveFileAttached',
		'filterCw',
		'filterTextOnly',
		'filterBot',
	],
	global: [
		'filterRenotes',
		'filterQuotes',
		'filterSensitiveFileAttached',
		'filterCw',
		'filterTextOnly',
		'filterBot',
		'filterLocal',
	],
	list: [
		'filterRenotes',
		'filterQuotes',
		'filterReplies',
		'filterSensitiveFileAttached',
		'filterCw',
		'filterTextOnly',
	],
	_appWideSettings_: [
		'filterRenotes',
		'filterQuotes',
		'filterReplies',
		'filterSensitiveFileAttached',
		'filterCw',
		'filterTextOnly',
		'filterBot',
		'filterLocal',
		'filterOutbound',
	],
} as const;

export type TlNoteFilterStore = {
	[K in keyof typeof tlNoteFilterAvailableSettingsList]: {
		soft: (typeof tlNoteFilterAvailableSettingsList[K][number])[];
		hard: (typeof tlNoteFilterAvailableSettingsList[K][number])[];
	};
};

// all empty
export const defaultTlNoteFilterStore: TlNoteFilterStore = {
	home: {
		soft: [],
		hard: [],
	},
	local: {
		soft: [],
		hard: [],
	},
	social: {
		soft: [],
		hard: [],
	},
	global: {
		soft: [],
		hard: [],
	},
	list: {
		soft: [],
		hard: [],
	},
	_appWideSettings_: {
		soft: [],
		hard: [],
	},
};
