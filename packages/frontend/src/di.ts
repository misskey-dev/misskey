/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InjectionKey, Ref } from 'vue';
import type { IRouter } from '@/nirax.js';

export const DI = {
	routerCurrentDepth: Symbol() as InjectionKey<number>,
	router: Symbol() as InjectionKey<IRouter>,
};
