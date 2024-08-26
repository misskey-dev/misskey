/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// https://vitejs.dev/config/build-options.html#build-modulepreload
import 'vite/modulepreload-polyfill';

import '@/style.scss';
import { createApp, defineAsyncComponent } from 'vue';
import { setIframeId } from '@/post-message.js';
import { parseEmbedParams } from '@/embed-page.js';

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

removeSplash();

function removeSplash() {
	const splash = document.getElementById('splash');
	if (splash) {
		splash.style.opacity = '0';
		splash.style.pointerEvents = 'none';

		// transitionendイベントが発火しない場合があるため
		window.setTimeout(() => {
			splash.remove();
		}, 1000);
	}
}
