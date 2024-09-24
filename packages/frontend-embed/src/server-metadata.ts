/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { misskeyApi } from '@/misskey-api.js';

const providedMetaEl = document.getElementById('misskey_meta');

const _serverMetadata: Misskey.entities.MetaDetailed | null = (providedMetaEl && providedMetaEl.textContent) ? JSON.parse(providedMetaEl.textContent) : null;

// NOTE: devモードのときしか _serverMetadata が null になることは無い
export const serverMetadata: Misskey.entities.MetaDetailed = _serverMetadata ?? await misskeyApi('meta', {
	detail: true,
});
