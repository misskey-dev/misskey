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
	path: [{
		name: 'acct',
		startsWith: '@',
	}, {
		name: 'page',
		optional: true,
		default: 'index',
	}],
	component: page(() => import('./pages/user/index.vue')),
}, {
	name: 'note',
	path: ['notes', { name: 'noteId' }],
	component: page(() => import('./pages/note.vue')),
}, {
	path: ['about'],
	component: page('about'),
}, {
	path: ['user-info', { name: 'userId' }],
	component: page('user-info'),
}, {
	name: 'index',
	path: [''],
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
	window.scroll({ top: scrollPosStore.get(ctx.key) ?? 0, behavior: 'instant' });
});

window.addEventListener('popstate', (event) => {
	mainRouter.change(document.location.pathname, event.state?.key);
	window.scroll({ top: scrollPosStore.get(event.state?.key), behavior: 'instant' });
});
