/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { inject } from 'vue';
import type { Router } from '@/router.js';
import { mainRouter } from '@/router/main.js';
import { DI } from '@/di.js';

/**
 * メインの{@link Router}を取得する。
 * あらかじめ{@link setupRouter}を実行しておく必要がある（{@link provide}により{@link Router}のインスタンスを注入可能であるならばこの限りではない）
 */
export function useRouter(): Router {
	return inject(DI.router, null) ?? mainRouter;
}

/**
 * 任意の{@link Router}を取得するためのファクトリを取得する。
 * あらかじめ{@link setupRouter}を実行しておく必要がある。
 */
export function useRouterFactory(): (path: string) => Router {
	const factory = inject<(path: string) => Router>('routerFactory');
	if (!factory) {
		console.error('routerFactory is not defined.');
		throw new Error('routerFactory is not defined.');
	}

	return factory;
}
