/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { miLocalStorage } from "@/local-storage.js";
import type { Keys } from "@/local-storage.js";
import { embedPage } from "@/config.js";

/**
 * EmbedページではlocalStorageを使用できないようにしているが、
 * 動作に必要な値はsafeSessionStorage（miLocalStorage内のやつ）に移動する
 */
export function initEmbedPageLocalStorage() {
	if (!embedPage) {
		return;
	}

	const keysToDuplicate: Keys[] = [
		'v',
		'lastVersion',
		'instance',
		'instanceCachedAt',
		'lang',
		'locale',
		'localeVersion',
	];

	keysToDuplicate.forEach(key => {
		const value = window.localStorage.getItem(key);
		if (value && !miLocalStorage.getItem(key)) {
			miLocalStorage.setItem(key, value);
		}
	});
}
