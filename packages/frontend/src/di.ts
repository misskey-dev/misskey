/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InjectionKey, Ref } from 'vue';
import type { Router } from '@/router.js';

export const DI = {
	routerCurrentDepth: Symbol() as InjectionKey<number>,
	router: Symbol() as InjectionKey<Router>,
	mock: Symbol() as InjectionKey<boolean>,
	pageMetadata: Symbol() as InjectionKey<Ref<Record<string, any> | null>>,
	viewId: Symbol() as InjectionKey<string>,
	currentStickyTop: Symbol() as InjectionKey<Ref<number>>,
	currentStickyBottom: Symbol() as InjectionKey<Ref<number>>,
	mfmEmojiReactCallback: Symbol() as InjectionKey<(emoji: string) => void>,
	inModal: Symbol() as InjectionKey<boolean>,
};
