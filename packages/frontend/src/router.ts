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

export function createRouter(fullPath: string): Router {
	return new Nirax(ROUTE_DEF, fullPath, !!$i, page(() => import('@/pages/not-found.vue')));
}

export const mainRouter = createRouter(window.location.pathname + window.location.search + window.location.hash);

// ブラウザのデフォルトのスクロール復元を無効化（SPAで手動管理するため）
if (history.scrollRestoration) {
	history.scrollRestoration = 'manual';
}

// 履歴エントリごとにユニークなIDを生成
let historyStateId = 0;

window.addEventListener('popstate', (event) => {
	// popstate（ブラウザバック/フォワード）が発生したことをマーク
	sessionStorage.setItem('__misskey_router_popstate', 'true');
	console.log('[Router] popstate event, state:', event.state);
	mainRouter.replaceByPath(window.location.pathname + window.location.search + window.location.hash);
});

mainRouter.addListener('push', ctx => {
	// 通常のページ遷移時はpopstateフラグをクリアしない（イラスト遷移の判定に使う）
	// sessionStorage.removeItem('__misskey_router_popstate'); // コメントアウト

	// 履歴エントリにユニークなIDを保存
	historyStateId++;
	window.history.pushState({ id: historyStateId, path: ctx.fullPath }, '', ctx.fullPath);
	console.log('[Router] push:', ctx.fullPath, 'state ID:', historyStateId);
});

mainRouter.addListener('replace', ctx => {
	window.history.replaceState({ }, '', ctx.fullPath);
});

mainRouter.addListener('change', ctx => {
	if (_DEV_) console.log('mainRouter: change', ctx.fullPath);
	analytics.page({
		path: ctx.fullPath,
		title: ctx.fullPath,
	});
});

mainRouter.init();

export function useRouter(): Router {
	return inject(DI.router, null) ?? mainRouter;
}
