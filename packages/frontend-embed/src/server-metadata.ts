/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { misskeyApi } from '@/misskey-api.js';

const providedMetaEl = document.getElementById('misskey_meta');

const _serverMetadata = (providedMetaEl && providedMetaEl.textContent) ? JSON.parse(providedMetaEl.textContent) : null;

// NOTE: devモードのときしか _serverMetadata が null になることは無い
export const serverMetadata = _serverMetadata ?? await misskeyApi('meta', {
	detail: true,
});
