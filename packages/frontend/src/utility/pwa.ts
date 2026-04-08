/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref, readonly } from 'vue';
import { store } from '@/store.js';
import { prefer } from '@/preferences.js';

interface WindowControlsOverlayGeometryChangeEvent extends Event {
	visible: boolean;
}

const windowControlsOverlayVisible = ref(false);
let windowControlsOverlayListenerAttached = false;

function onGeometryChange(ev: WindowControlsOverlayGeometryChangeEvent) {
	const { visible } = ev;
	windowControlsOverlayVisible.value = visible;

	let htmlThemeColor: string | null = null;
	const computedStyle = getComputedStyle(window.document.documentElement);
	if (visible) {
		htmlThemeColor = computedStyle.getPropertyValue('--MI_THEME-navBg').trim() || null;
	} else {
		htmlThemeColor = computedStyle.getPropertyValue('--MI_THEME-htmlThemeColor').trim() || null;
	}
	if (htmlThemeColor) {
		for (const tag of window.document.head.children) {
			if (tag.tagName === 'META' && tag.getAttribute('name') === 'theme-color') {
				tag.setAttribute('content', htmlThemeColor);
				break;
			}
		}
	}
}

export function getWindowControlsOverlayVisible() {
	if (!windowControlsOverlayListenerAttached && 'windowControlsOverlay' in navigator) {
		// @ts-expect-error Experimental API
		navigator.windowControlsOverlay.addEventListener('geometrychange', onGeometryChange);
		windowControlsOverlayListenerAttached = true;
	}
	// @ts-expect-error Experimental API
	windowControlsOverlayVisible.value = 'windowControlsOverlay' in navigator && navigator.windowControlsOverlay.visible;

	return readonly(windowControlsOverlayVisible);
}
