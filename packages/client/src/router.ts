import { AsyncComponentLoader, defineAsyncComponent, markRaw } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import MkLoading from '@/pages/_loading_.vue';
import MkError from '@/pages/_error_.vue';
import MkTimeline from '@/pages/timeline.vue';
import { $i, iAmModerator } from './account';
import { ui } from '@/config';
import { pleaseLogin } from './scripts/please-login';

// pathに/が入るとrollupが解決してくれないので、() => import('*.vue')を指定すること
const page = (path: string | AsyncComponentLoader<any>, uiName?: string) => defineAsyncComponent({
	loader: typeof path === 'string' ? uiName ? () => import(`./ui/${ui}/pages/${path}.vue`) : () => import(`./pages/${path}.vue`) : path,
	loadingComponent: MkLoading,
	errorComponent: MkError,
});

const signinRequired = () => {
	pleaseLogin('/', false);
}

let indexScrollPos = 0;

const defaultRoutes = [
	// NOTE: MkTimelineをdynamic importするとAsyncComponentWrapperが間に入るせいでkeep-aliveのコンポーネント指定が効かなくなる
	{ path: '/', name: 'index', component: $i ? MkTimeline : page('welcome') },
	{ path: '/@:acct/:page?', name: 'user', component: page(() => import('./pages/user/index.vue')), props: route => ({ acct: route.params.acct, page: route.params.page || 'index' }) },
	{ path: '/@:user/pages/:page', component: page('page'), props: route => ({ pageName: route.params.page, username: route.params.user }) },
	{ path: '/@:user/pages/:pageName/view-source', component: page(() => import('./pages/page-editor/page-editor.vue')), props: route => ({ initUser: route.params.user, initPageName: route.params.pageName }) },
	{ path: '/settings/:page(.*)?', name: 'settings', component: page(() => import('./pages/settings/index.vue')), props: route => ({ initialPage: route.params.page || null }), beforeEnter: signinRequired },
	{ path: '/reset-password/:token?', component: page('reset-password'), props: route => ({ token: route.params.token }) },
	{ path: '/signup-complete/:code', component: page('signup-complete'), props: route => ({ code: route.params.code }) },
	{ path: '/announcements', component: page('announcements') },
	{ path: '/about', component: page('about') },
	{ path: '/about-misskey', component: page('about-misskey') },
	{ path: '/featured', component: page('featured') },
	{ path: '/theme-editor', component: page('theme-editor'), beforeEnter: signinRequired },
	{ path: '/explore', component: page('explore') },
	{ path: '/explore/tags/:tag', props: true, component: page('explore') },
	{ path: '/federation', component: page('federation') },
	{ path: '/emojis', component: page('emojis') },
	{ path: '/search', component: page('search'), props: route => ({ query: route.query.q, channel: route.query.channel }) },
	{ path: '/pages', name: 'pages', component: page('pages') },
	{ path: '/pages/new', component: page(() => import('./pages/page-editor/page-editor.vue')) },
	{ path: '/pages/edit/:pageId', component: page(() => import('./pages/page-editor/page-editor.vue')), props: route => ({ initPageId: route.params.pageId }), beforeEnter: signinRequired },
	{ path: '/gallery', component: page(() => import('./pages/gallery/index.vue')) },
	{ path: '/gallery/new', component: page(() => import('./pages/gallery/edit.vue')), beforeEnter: signinRequired },
	{ path: '/gallery/:postId/edit', component: page(() => import('./pages/gallery/edit.vue')), props: route => ({ postId: route.params.postId }), beforeEnter: signinRequired },
	{ path: '/gallery/:postId', component: page(() => import('./pages/gallery/edit.vue')), props: route => ({ postId: route.params.postId }) },
	{ path: '/channels', component: page('channels') },
	{ path: '/channels/new', component: page('channel-editor'), beforeEnter: signinRequired },
	{ path: '/channels/:channelId/edit', component: page('channel-editor'), props: true, beforeEnter: signinRequired },
	{ path: '/channels/:channelId', component: page('channel'), props: route => ({ channelId: route.params.channelId }) },
	{ path: '/clips/:clipId', component: page('clip'), props: route => ({ clipId: route.params.clipId }) },
	{ path: '/timeline/list/:listId', component: page('user-list-timeline'), props: route => ({ listId: route.params.listId }), beforeEnter: signinRequired },
	{ path: '/timeline/antenna/:antennaId', component: page('antenna-timeline'), props: route => ({ antennaId: route.params.antennaId }), beforeEnter: signinRequired },
	{ path: '/my/notifications', component: page('notifications'), beforeEnter: signinRequired },
	{ path: '/my/favorites', component: page('favorites'), beforeEnter: signinRequired },
	{ path: '/my/messages', component: page('messages'), beforeEnter: signinRequired },
	{ path: '/my/mentions', component: page('mentions'), beforeEnter: signinRequired },
	{ path: '/my/messaging', name: 'messaging', component: page(() => import('./pages/messaging/index.vue')), beforeEnter: signinRequired },
	{ path: '/my/messaging/:user', component: page(() => import('./pages/messaging/messaging-room.vue')), props: route => ({ userAcct: route.params.user }), beforeEnter: signinRequired },
	{ path: '/my/messaging/group/:group', component: page(() => import('./pages/messaging/messaging-room.vue')), props: route => ({ groupId: route.params.group }), beforeEnter: signinRequired },
	{ path: '/my/drive', name: 'drive', component: page('drive'), beforeEnter: signinRequired },
	{ path: '/my/drive/folder/:folder', component: page('drive'), beforeEnter: signinRequired },
	{ path: '/my/follow-requests', component: page('follow-requests'), beforeEnter: signinRequired },
	{ path: '/my/lists', component: page(() => import('./pages/my-lists/index.vue')), beforeEnter: signinRequired },
	{ path: '/my/lists/:list', component: page(() => import('./pages/my-lists/list.vue')), beforeEnter: signinRequired },
	{ path: '/my/groups', component: page(() => import('./pages/my-groups/index.vue')), beforeEnter: signinRequired },
	{ path: '/my/groups/:group', component: page(() => import('./pages/my-groups/group.vue')), props: route => ({ groupId: route.params.group }), beforeEnter: signinRequired },
	{ path: '/my/antennas', component: page(() => import('./pages/my-antennas/index.vue')), beforeEnter: signinRequired },
	{ path: '/my/antennas/create', component: page(() => import('./pages/my-antennas/create.vue')), beforeEnter: signinRequired },
	{ path: '/my/antennas/:antennaId', component: page(() => import('./pages/my-antennas/edit.vue')), props: true, beforeEnter: signinRequired },
	{ path: '/my/clips', component: page(() => import('./pages/my-clips/index.vue')), beforeEnter: signinRequired },
	{ path: '/scratchpad', component: page('scratchpad') },
	{ path: '/admin/:page(.*)?', component: iAmModerator ? page(() => import('./pages/admin/index.vue')) : page('not-found'), props: route => ({ initialPage: route.params.page || null }) },
	{ path: '/admin', component: iAmModerator ? page(() => import('./pages/admin/index.vue')) : page('not-found') },
	{ path: '/notes/:note', name: 'note', component: page('note'), props: route => ({ noteId: route.params.note }) },
	{ path: '/tags/:tag', component: page('tag'), props: route => ({ tag: route.params.tag }) },
	{ path: '/user-info/:user', component: page('user-info'), props: route => ({ userId: route.params.user }) },
	{ path: '/instance-info/:host', component: page('instance-info'), props: route => ({ host: route.params.host }) },
	{ path: '/mfm-cheat-sheet', component: page('mfm-cheat-sheet') },
	{ path: '/api-console', component: page('api-console'), beforeEnter: signinRequired },
	{ path: '/preview', component: page('preview') },
	{ path: '/auth/:token', component: page('auth') },
	{ path: '/miauth/:session', component: page('miauth') },
	{ path: '/authorize-follow', component: page('follow'), beforeEnter: signinRequired },
	{ path: '/share', component: page('share'), beforeEnter: signinRequired },
	{ path: '/:catchAll(.*)', component: page('not-found') }
];

const chatRoutes = [
	{ path: '/timeline', component: page('timeline', 'chat'), props: route => ({ src: 'home' }) },
	{ path: '/timeline/home', component: page('timeline', 'chat'), props: route => ({ src: 'home' }) },
	{ path: '/timeline/local', component: page('timeline', 'chat'), props: route => ({ src: 'local' }) },
	{ path: '/timeline/social', component: page('timeline', 'chat'), props: route => ({ src: 'social' }) },
	{ path: '/timeline/global', component: page('timeline', 'chat'), props: route => ({ src: 'global' }) },
	{ path: '/channels/:channelId', component: page('channel', 'chat'), props: route => ({ channelId: route.params.channelId }) },
];

function margeRoutes(routes: any[]) {
	const result = defaultRoutes;
	for (const route of routes) {
		const found = result.findIndex(x => x.path === route.path);
		if (found > -1) {
			result[found] = route;
		} else {
			result.unshift(route);
		}
	}
	return result;
}

export const router = createRouter({
	history: createWebHistory(),
	routes: margeRoutes(ui === 'chat' ? chatRoutes : []),
	// なんかHacky
	// 通常の使い方をすると scroll メソッドの behavior を設定できないため、自前で window.scroll するようにする
	scrollBehavior(to) {
		window._scroll = () => { // さらにHacky
			if (to.name === 'index') {
				window.scroll({ top: indexScrollPos, behavior: 'instant' });
				const i = window.setInterval(() => {
					window.scroll({ top: indexScrollPos, behavior: 'instant' });
				}, 10);
				window.setTimeout(() => {
					window.clearInterval(i);
				}, 500);
			} else {
				window.scroll({ top: 0, behavior: 'instant' });
			}
		};
	}
});

router.afterEach((to, from) => {
	if (from.name === 'index') {
		indexScrollPos = window.scrollY;
	}
});

export function resolve(path: string) {
	const resolved = router.resolve(path);
	const route = resolved.matched[0];
	return {
		component: markRaw(route.components.default),
		// TODO: route.propsには関数以外も入る可能性があるのでよしなにハンドリングする
		props: route.props?.default ? route.props.default(resolved) : resolved.params
	};
}
