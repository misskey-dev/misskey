/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// https://vitejs.dev/config/build-options.html#build-modulepreload
import 'vite/modulepreload-polyfill';

import '@/style.scss';
import { createApp, defineAsyncComponent } from 'vue';
import { setIframeId, postMessageToParentWindow } from '@/scripts/post-message.js';
import { parseEmbedParams } from '@/embed-page.js';
import { createEmbedRouter } from '@/router.js';

const params = new URLSearchParams(location.search);
const embedParams = parseEmbedParams(params);

// サイズの制限
document.documentElement.style.maxWidth = '500px';

// iframeIdの設定
function setIframeIdHandler(event: MessageEvent) {
	if (event.data?.type === 'misskey:embedParent:registerIframeId' && event.data.payload?.iframeId != null) {
		setIframeId(event.data.payload.iframeId);
		window.removeEventListener('message', setIframeIdHandler);
	}
}

window.addEventListener('message', setIframeIdHandler);

const app = createApp(
	defineAsyncComponent(() => import('@/ui.vue')),
);

//#region Embed Provide
app.provide('embedParams', embedParams);
//#endregion

