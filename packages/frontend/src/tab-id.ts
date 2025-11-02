/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { genId } from '@/utility/id.js';

// HMR有効時にバグか知らんけど複数回実行されるのでその対策
export const TAB_ID = window.sessionStorage.getItem('TAB_ID') ?? genId();
window.sessionStorage.setItem('TAB_ID', TAB_ID);
if (_DEV_) console.log('TAB_ID', TAB_ID);
