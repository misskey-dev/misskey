/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defaultStore } from '@/store.js';

await defaultStore.ready;

const ua = navigator.userAgent.toLowerCase();
const isTablet = /ipad/.test(ua) || (/mobile|iphone|android/.test(ua) && window.innerWidth > 700);
const isSmartphone = !isTablet && /mobile|iphone|android/.test(ua);

export const deviceKind: 'smartphone' | 'tablet' | 'desktop' = defaultStore.state.overridedDeviceKind ? defaultStore.state.overridedDeviceKind
	: isSmartphone ? 'smartphone'
	: isTablet ? 'tablet'
	: 'desktop';
