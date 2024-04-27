/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defaultStore } from '@/store.js';

await defaultStore.ready;

const ua = navigator.userAgent.toLowerCase();
const isTablet = /ipad/.test(ua) || (/mobile|iphone|android/.test(ua) && window.innerWidth > 700);
const isSmartphone = !isTablet && /mobile|iphone|android/.test(ua);

const isIPhone = /iphone|ipod/gi.test(ua) && navigator.maxTouchPoints > 1;
// navigator.platform may be deprecated but this check is still required
const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
const isIos = /ipad|iphone|ipod/gi.test(ua) && navigator.maxTouchPoints > 1;

export const isFullscreenNotSupported = isIPhone || isIos;

export const deviceKind: 'smartphone' | 'tablet' | 'desktop' = defaultStore.state.overridedDeviceKind ? defaultStore.state.overridedDeviceKind
	: isSmartphone ? 'smartphone'
	: isTablet ? 'tablet'
	: 'desktop';
