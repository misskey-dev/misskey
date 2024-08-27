/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// https://vitejs.dev/config/build-options.html#build-modulepreload
import 'vite/modulepreload-polyfill';

import '@tabler/icons-webfont/dist/tabler-icons.scss';

import '@/style.scss';
import { createApp, defineAsyncComponent } from 'vue';
import lightTheme from '@@/themes/l-light.json5';
import darkTheme from '@@/themes/d-dark.json5';
import { applyTheme } from './theme.js';
import { fetchCustomEmojis } from './custom-emojis.js';
import { setIframeId } from '@/post-message.js';
import { parseEmbedParams } from '@/embed-page.js';

console.info('Misskey Embed');

const params = new URLSearchParams(location.search);
const embedParams = parseEmbedParams(params);

console.info(embedParams);

if (embedParams.colorMode === 'dark') {
	applyTheme(darkTheme);
} else if (embedParams.colorMode === 'light') {
	applyTheme(lightTheme);
} else {
	if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
		applyTheme(darkTheme);
	} else {
		applyTheme(lightTheme);
	}
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (mql) => {
		if (mql.matches) {
			applyTheme(darkTheme);
		} else {
			applyTheme(lightTheme);
		}
	});
}

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

try {
	await fetchCustomEmojis();
} catch (err) { /* empty */ }

const app = createApp(
	defineAsyncComponent(() => import('@/ui.vue')),
);

//#region Embed Provide
app.provide('embedParams', embedParams);
//#endregion

// https://github.com/misskey-dev/misskey/pull/8575#issuecomment-1114239210
// なぜか2回実行されることがあるため、mountするdivを1つに制限する
const rootEl = ((): HTMLElement => {
	const MISSKEY_MOUNT_DIV_ID = 'misskey_app';

	const currentRoot = document.getElementById(MISSKEY_MOUNT_DIV_ID);

	if (currentRoot) {
		console.warn('multiple import detected');
		return currentRoot;
	}

	const root = document.createElement('div');
	root.id = MISSKEY_MOUNT_DIV_ID;
	document.body.appendChild(root);
	return root;
})();

app.mount(rootEl);

// boot.jsのやつを解除
window.onerror = null;
window.onunhandledrejection = null;

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
