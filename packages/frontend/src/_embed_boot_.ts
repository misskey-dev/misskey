/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// https://vitejs.dev/config/build-options.html#build-modulepreload
import 'vite/modulepreload-polyfill';

import '@/style.scss';
import '@/style.embed.scss';
import { createApp, defineAsyncComponent } from 'vue';
import { common } from '@/boot/common.js';
import type { CommonBootOptions } from '@/boot/common.js';
import { setIframeId, postMessageToParentWindow } from '@/scripts/post-message.js';
import { defaultStore } from '@/store.js';

const bootOptions: Partial<CommonBootOptions> = {};

// カラーモードのオーバーライド
const params = new URLSearchParams(location.search);
const color = params.get('colorMode');
if (color && ['light', 'dark'].includes(color)) {
	bootOptions.forceColorMode = color as 'light' | 'dark';
}

// 外部タブでのstoreの変更の影響を受けないように
defaultStore.setConfig({
	disableMessageChannel: true,
});

// iframeIdの設定
window.addEventListener('message', event => {
	if (event.data?.type === 'misskey:embedParent:registerIframeId' && event.data.payload?.iframeId != null) {
		setIframeId(event.data.payload.iframeId);
	}
});

// 起動
common(() => createApp(
	defineAsyncComponent(() => import('@/ui/embed.vue')),
), bootOptions).then(({ isClientUpdated }) => {
	// 起動完了を通知（このあとクライアント側から misskey:embedParent:registerIframeId が送信される）
	postMessageToParentWindow('misskey:embed:ready');
});
