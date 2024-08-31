/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { miLocalStorage } from '@/local-storage.js';

// TODO: 他のタブと永続化されたstateを同期

//#region loader
const providedMetaEl = document.getElementById('misskey_meta');

let cachedMeta = miLocalStorage.getItem('instance') ? JSON.parse(miLocalStorage.getItem('instance')!) : null;
let cachedAt = miLocalStorage.getItem('instanceCachedAt') ? parseInt(miLocalStorage.getItem('instanceCachedAt')!) : 0;
const providedMeta = providedMetaEl && providedMetaEl.textContent ? JSON.parse(providedMetaEl.textContent) : null;
const providedAt = providedMetaEl && providedMetaEl.dataset.generatedAt ? parseInt(providedMetaEl.dataset.generatedAt) : 0;
if (providedAt > cachedAt) {
	miLocalStorage.setItem('instance', JSON.stringify(providedMeta));
	miLocalStorage.setItem('instanceCachedAt', providedAt.toString());
	cachedMeta = providedMeta;
	cachedAt = providedAt;
}
//#endregion

let metadata: Misskey.entities.MetaDetailed | null = cachedMeta ?? null;

// TODO: 短時間に複数回呼ばれてもリクエストは一回だけにする
export async function fetchServerMetadata(force = false): Promise<Misskey.entities.MetaDetailed> {
	if (!force && metadata != null) {
		if (Date.now() - cachedAt < 1000 * 60 * 60) {
			return metadata;
		}
	}

	metadata = await misskeyApi('meta', {
		detail: true,
	});

	cachedAt = Date.now();
	miLocalStorage.setItem('instance', JSON.stringify(metadata));
	miLocalStorage.setItem('instanceCachedAt', Date.now().toString());

	return metadata!;
}
