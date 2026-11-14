/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readonly, ref } from 'vue';
import { TabManager } from '@/lib/TabManager.js';
import { genId } from '@/utility/id.js';

export const TAB_ID = genId();
if (_DEV_) console.log('TAB_ID', TAB_ID);

export const tabManager = new TabManager(TAB_ID);

const _isMainTab = ref<boolean>(false);

tabManager.on('changeMainStatus', (isMain) => {
	_isMainTab.value = isMain;
});

export const isMainTab = readonly(_isMainTab);
