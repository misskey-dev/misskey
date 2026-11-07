/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Component } from 'vue';
import { Nirax } from '@/lib/nirax.js';
import type { RouteDef } from '@/lib/nirax.js';

export const homeComponent = { name: 'home-page' } as Component;
export const postComponent = { name: 'post-page' } as Component;
export const fileComponent = { name: 'file-page' } as Component;
export const optionalComponent = { name: 'optional-page' } as Component;
export const userComponent = { name: 'user-page' } as Component;
export const followersComponent = { name: 'followers-page' } as Component;
export const privateComponent = { name: 'private-page' } as Component;
export const notFoundRouteComponent = { name: 'not-found-route' } as Component;
export const loginFallbackComponent = { name: 'login-fallback' } as Component;

export const routes = [
	{
		path: '/',
		component: homeComponent,
	},
	{
		path: '/posts/:postId',
		component: postComponent,
		query: {
			from: 'source',
		},
		hash: 'section',
	},
	{
		path: '/files/:path(*)',
		component: fileComponent,
	},
	{
		path: '/optional/:slug?',
		component: optionalComponent,
	},
	{
		path: '/old',
		redirect: '/posts/redirected',
	},
	{
		path: '/legacy/:postId',
		redirect: props => `/posts/${props.get('postId')}`,
	},
	{
		path: '/loop-a',
		redirect: '/loop-b',
	},
	{
		path: '/loop-b',
		redirect: '/loop-a',
	},
	{
		path: '/user/:id',
		component: userComponent,
		children: [
			{
				path: '/followers',
				component: followersComponent,
			},
		],
	},
	{
		path: '/private',
		component: privateComponent,
		loginRequired: true,
	},
	{
		path: '/:(*)',
		component: notFoundRouteComponent,
	},
] as const satisfies RouteDef[];

export function createRouter(currentFullPath = '/', isLoggedIn = true) {
	return new Nirax(routes, currentFullPath, isLoggedIn, loginFallbackComponent);
}
