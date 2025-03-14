/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InjectionKey, Ref } from 'vue';
import type { IRouter, RouterFlag } from '@/nirax.js';

export const DI = {
	routerCurrentDepth: Symbol() as InjectionKey<number>,
	router: Symbol() as InjectionKey<IRouter>,
	viewId: Symbol() as InjectionKey<string>,
	viewTransitionId: Symbol() as InjectionKey<Ref<string>>,
	mock: Symbol() as InjectionKey<boolean>,
	navHook: Symbol() as InjectionKey<(path: string, flag?: RouterFlag) => void>,
};
