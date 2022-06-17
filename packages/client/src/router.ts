import { AsyncComponentLoader, defineAsyncComponent } from 'vue';
import { Router } from '@/nirax';
import { $i, iAmModerator } from '@/account';
import MkLoading from '@/pages/_loading_.vue';
import MkError from '@/pages/_error_.vue';
import MkTimeline from '@/pages/timeline.vue';
import { ui } from '@/config';

// pathに/が入るとrollupが解決してくれないので、() => import('*.vue')を指定すること
const page = (path: string | AsyncComponentLoader<any>, uiName?: string) => defineAsyncComponent({
	loader: typeof path === 'string' ? uiName ? () => import(`./ui/${ui}/pages/${path}.vue`) : () => import(`./pages/${path}.vue`) : path,
	loadingComponent: MkLoading,
	errorComponent: MkError,
});

export const routes = [{
	name: 'user',
	path: '/@:acct/:page?',
	component: page(() => import('./pages/user/index.vue')),
}, {
	path: '/@:initUser/pages/:initPageName/view-source',
	component: page('pages/page-editor/page-editor'),
}, {
	path: '/@:username/pages/:pageName',
	component: page('page'),
}, {
	name: 'note',
	path: '/notes/:noteId',
	component: page('note'),
}, {
	path: '/about',
	component: page('about'),
}, {
	path: '/user-info/:userId',
	component: page('user-info'),
}, {
	name: 'settings',
	path: '/settings/:initialPage(.*)?',
	component: page(() => import('./pages/settings/index.vue')),
}, {
	name: 'index',
	path: '/',
	component: $i ? MkTimeline : page('welcome'),
	globalCacheKey: 'index',
}];

export const mainRouter = new Router(routes, location.pathname);

window.history.replaceState({ key: mainRouter.getCurrentKey() }, '', location.href);

const scrollPosStore = new Map<string, number>();

window.setInterval(() => {
	scrollPosStore.set(window.history.state?.key, window.scrollY);
}, 1000);

mainRouter.addListener('push', ctx => {
	window.history.pushState({ key: ctx.key }, '', ctx.path);
	const scrollPos = scrollPosStore.get(ctx.key) ?? 0;
	window.scroll({ top: scrollPos, behavior: 'instant' });
	if (scrollPos !== 0) {
		window.setTimeout(() => { // 遷移直後はタイミングによってはコンポーネントが復元し切ってない可能性も考えられるため少し時間を空けて再度スクロール
			window.scroll({ top: scrollPos, behavior: 'instant' });
		}, 1000);
	}
});

window.addEventListener('popstate', (event) => {
	mainRouter.change(document.location.pathname, event.state?.key);
	const scrollPos = scrollPosStore.get(event.state?.key) ?? 0;
	window.scroll({ top: scrollPos, behavior: 'instant' });
	window.setTimeout(() => { // 遷移直後はタイミングによってはコンポーネントが復元し切ってない可能性も考えられるため少し時間を空けて再度スクロール
		window.scroll({ top: scrollPos, behavior: 'instant' });
	}, 1000);
});
