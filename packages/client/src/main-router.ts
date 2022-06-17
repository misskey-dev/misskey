import { AsyncComponentLoader, defineAsyncComponent } from 'vue';
import { Router } from '@/router/router';
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

export const mainRouter = new Router([{
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
	path: ['about'],
	component: page('about'),
}, {
	path: ['user-info', { name: 'userId' }],
	component: page('user-info'),
}, {
	path: [''],
	component: $i ? MkTimeline : page('welcome'),
}], location.pathname);

window.history.replaceState({ key: mainRouter.getCurrentKey(), scrollPos: 0 }, '', location.href);

// スクロール位置をstateに書き込むためだけのinterval
window.setInterval(() => {
	window.history.replaceState({ key: window.history.state?.key, scrollPos: window.scrollY }, '', location.href);
}, 1000);

mainRouter.addListener('push', ctx => {
	window.history.pushState({ key: ctx.key, scrollPos: window.scrollY }, '', ctx.path);
	window.scroll({ top: 0, behavior: 'instant' });
});

window.addEventListener('popstate', (event) => {
	mainRouter.change(document.location.pathname, event.state?.key);
	window.scroll({ top: event.state?.scrollPos, behavior: 'instant' });
	//mainRouter.push(document.location.pathname);
});
