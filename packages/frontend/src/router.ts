/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { inject } from 'vue';
import { page } from '@/router.definition.js';
import { $i } from '@/i.js';
import { Nirax } from '@/lib/nirax.js';
import { ROUTE_DEF } from '@/router.definition.js';
import { analytics } from '@/analytics.js';
import { DI } from '@/di.js';

export type Router = Nirax<typeof ROUTE_DEF>;

export function createRouter(path: string): Router {
	return new Nirax(ROUTE_DEF, path, !!$i, page(() => import('@/pages/not-found.vue')));
}

export const mainRouter = createRouter(location.pathname + location.search + location.hash);

window.addEventListener('popstate', (event) => {
	mainRouter.replace(location.pathname + location.search + location.hash);
});

mainRouter.addListener('push', ctx => {
	window.history.pushState({ }, '', ctx.path);
});

mainRouter.addListener('replace', ctx => {
	window.history.replaceState({ }, '', ctx.path);
});

mainRouter.addListener('change', ctx => {
	console.log('mainRouter: change', ctx.path);
	analytics.page({
		path: ctx.path,
		title: ctx.path,
	});
});

mainRouter.init();

export function useRouter(): Router {
	return inject(DI.router, null) ?? mainRouter;
}
