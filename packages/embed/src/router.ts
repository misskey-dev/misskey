/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { IRouter, RouteDef } from '@/nirax.js';
import { Router } from '@/nirax.js';
import { page } from '@/router/definition.js';

const routes: RouteDef[] = [{
	path: '/embed/notes/:noteId',
	component: page(() => import('@/embed/pages/note.vue')),
}, {
	path: '/embed/user-timeline/@:username',
	component: page(() => import('@/embed/pages/user-timeline.vue')),
}, {
	path: '/embed/clips/:clipId',
	component: page(() => import('@/embed/pages/clip.vue')),
}, {
	path: '/embed/tags/:tag',
	component: page(() => import('@/embed/pages/tag.vue')),
}, {
	path: '/:(*)',
	component: page(() => import('@/pages/not-found.vue')),
}];

export function createEmbedRouter(path: string): IRouter {
	return new Router(routes, path, false, page(() => import('@/pages/not-found.vue')));
}
