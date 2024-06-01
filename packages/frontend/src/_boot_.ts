/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// https://vitejs.dev/config/build-options.html#build-modulepreload
import 'vite/modulepreload-polyfill';

import '@/style.scss';
import type { CommonBootOptions } from '@/boot/common.js';
import { mainBoot } from '@/boot/main-boot.js';
import { subBoot } from '@/boot/sub-boot.js';
import { isEmbedPage } from '@/scripts/embed-page.js';
import { setIframeId, postMessageToParentWindow } from '@/scripts/post-message.js';

const subBootPaths = ['/share', '/auth', '/miauth', '/signup-complete'];

if (isEmbedPage()) {
	const bootOptions: Partial<CommonBootOptions> = {};

	const params = new URLSearchParams(location.search);
	const color = params.get('color');
	if (color && ['light', 'dark'].includes(color)) {
		bootOptions.forceColorMode = color as 'light' | 'dark';
	}

	window.addEventListener('message', event => {
		if (event.data?.type === 'misskey:embedParent:registerIframeId' && event.data.payload?.iframeId != null) {
			setIframeId(event.data.payload.iframeId);
		}
	});

	subBoot(bootOptions, true).then(() => {
		postMessageToParentWindow('misskey:embed:ready');
	});
} else if (subBootPaths.some(i => location.pathname === i || location.pathname.startsWith(i + '/'))) {
	subBoot();
} else {
	mainBoot();
}
