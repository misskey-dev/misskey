/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// https://vitejs.dev/config/build-options.html#build-modulepreload
import 'vite/modulepreload-polyfill';

import '@/style.scss';
import { mainBoot } from '@/boot/main-boot.js';
import { subBoot } from '@/boot/sub-boot.js';
import { isEmbedPage } from '@/scripts/embed-page.js';

const subBootPaths = ['/share', '/auth', '/miauth', '/signup-complete', '/embed'];

if (subBootPaths.some(i => location.pathname === i || location.pathname.startsWith(i + '/'))) {
	if (isEmbedPage()) {
		const params = new URLSearchParams(location.search);
		const color = params.get('color');
		if (color && ['light', 'dark'].includes(color)) {
			subBoot({ forceColorMode: color as 'light' | 'dark' });
		}
	}
	
	subBoot();
} else {
	mainBoot();
}
