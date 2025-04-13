/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref } from 'vue';
import { deviceKind } from '@/utility/device-kind.js';

const isTouchSupported = 'maxTouchPoints' in navigator && navigator.maxTouchPoints > 0;

export let isTouchUsing = deviceKind === 'tablet' || deviceKind === 'smartphone';

if (isTouchSupported && !isTouchUsing) {
	window.addEventListener('touchstart', () => {
		// maxTouchPointsなどでの判定だけだと、「タッチ機能付きディスプレイを使っているがマウスでしか操作しない」場合にも
		// タッチで使っていると判定されてしまうため、実際に一度でもタッチされたらtrueにする
		isTouchUsing = true;
	}, { passive: true });
}

/** (MkHorizontalSwipe) 横スワイプ中か？ */
export const isHorizontalSwipeSwiping = ref(false);
