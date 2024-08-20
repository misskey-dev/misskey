/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { IRouter, RouteDef } from '@/nirax.js';
import { Router } from '@/nirax.js';
import { page } from '@/router/definition.js';
import { $i } from '@/account.js';

const routes: RouteDef[] = [{
	path: '/embed/notes/:noteId',
	component: page(() => import('@/pages/embed/note.vue')),
}, {
	path: '/embed/user-timeline/@:username',
	component: page(() => import('@/pages/embed/user-timeline.vue')),
}, {
	path: '/embed/clips/:clipId',
	component: page(() => import('@/pages/embed/clip.vue')),
}, {
	path: '/embed/tags/:tag',
	component: page(() => import('@/pages/embed/tag.vue')),
}, {
	path: '/:(*)',
	component: page(() => import('@/pages/not-found.vue')),
}];

export function createEmbedRouter(path: string): IRouter {
	return new Router(routes, path, !!$i, page(() => import('@/pages/not-found.vue')));
}
