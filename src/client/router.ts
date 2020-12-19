import { defineAsyncComponent, markRaw } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import MkLoading from '@/pages/_loading_.vue';
import MkError from '@/pages/_error_.vue';
import MkTimeline from '@/pages/timeline.vue';
import { $i } from './account';

const page = (path: string) => defineAsyncComponent({
	loader: () => import(`./pages/${path}.vue`),
	loadingComponent: MkLoading,
	errorComponent: MkError,
});

let indexScrollPos = 0;

export const router = createRouter({
	history: createWebHistory(),
	routes: [
		// NOTE: MkTimelineをdynamic importするとAsyncComponentWrapperが間に入るせいでkeep-aliveのコンポーネント指定が効かなくなる
		{ path: '/', name: 'index', component: $i ? MkTimeline : page('welcome') },
		{ path: '/@:acct/:page?', name: 'user', component: page('user/index'), props: route => ({ acct: route.params.acct, page: route.params.page || 'index' }) },
		{ path: '/@:user/pages/:page', component: page('page'), props: route => ({ pageName: route.params.page, username: route.params.user }) },
		{ path: '/@:user/pages/:pageName/view-source', component: page('page-editor/page-editor'), props: route => ({ initUser: route.params.user, initPageName: route.params.pageName }) },
		{ path: '/@:acct/room', props: true, component: page('room/room') },
		{ path: '/settings/:page(.*)?', name: 'settings', component: page('settings/index'), props: route => ({ page: route.params.page || null }) },
		{ path: '/announcements', component: page('announcements') },
		{ path: '/about', component: page('about') },
		{ path: '/about-misskey', component: page('about-misskey') },
		{ path: '/featured', component: page('featured') },
		{ path: '/docs', component: page('docs') },
		{ path: '/theme-editor', component: page('theme-editor') },
		{ path: '/docs/:doc', component: page('doc'), props: true },
		{ path: '/explore', component: page('explore') },
		{ path: '/explore/tags/:tag', props: true, component: page('explore') },
		{ path: '/search', component: page('search') },
		{ path: '/pages', name: 'pages', component: page('pages') },
		{ path: '/pages/new', component: page('page-editor/page-editor') },
		{ path: '/pages/edit/:pageId', component: page('page-editor/page-editor'), props: route => ({ initPageId: route.params.pageId }) },
		{ path: '/channels', component: page('channels') },
		{ path: '/channels/new', component: page('channel-editor') },
		{ path: '/channels/:channelId/edit', component: page('channel-editor'), props: true },
		{ path: '/channels/:channelId', component: page('channel'), props: route => ({ channelId: route.params.channelId }) },
		{ path: '/clips/:clipId', component: page('clip'), props: route => ({ clipId: route.params.clipId }) },
		{ path: '/my/notifications', component: page('notifications') },
		{ path: '/my/favorites', component: page('favorites') },
		{ path: '/my/messages', component: page('messages') },
		{ path: '/my/mentions', component: page('mentions') },
		{ path: '/my/messaging', name: 'messaging', component: page('messaging/index') },
		{ path: '/my/messaging/:user', component: page('messaging/messaging-room'), props: route => ({ userAcct: route.params.user }) },
		{ path: '/my/messaging/group/:group', component: page('messaging/messaging-room'), props: route => ({ groupId: route.params.group }) },
		{ path: '/my/drive', name: 'drive', component: page('drive') },
		{ path: '/my/drive/folder/:folder', component: page('drive') },
		{ path: '/my/follow-requests', component: page('follow-requests') },
		{ path: '/my/lists', component: page('my-lists/index') },
		{ path: '/my/lists/:list', component: page('my-lists/list') },
		{ path: '/my/groups', component: page('my-groups/index') },
		{ path: '/my/groups/:group', component: page('my-groups/group') },
		{ path: '/my/antennas', component: page('my-antennas/index') },
		{ path: '/my/clips', component: page('my-clips/index') },
		{ path: '/scratchpad', component: page('scratchpad') },
		{ path: '/instance', component: page('instance/index') },
		{ path: '/instance/emojis', component: page('instance/emojis') },
		{ path: '/instance/users', component: page('instance/users') },
		{ path: '/instance/logs', component: page('instance/logs') },
		{ path: '/instance/files', component: page('instance/files') },
		{ path: '/instance/queue', component: page('instance/queue') },
		{ path: '/instance/settings', component: page('instance/settings') },
		{ path: '/instance/federation', component: page('instance/federation') },
		{ path: '/instance/relays', component: page('instance/relays') },
		{ path: '/instance/announcements', component: page('instance/announcements') },
		{ path: '/instance/abuses', component: page('instance/abuses') },
		{ path: '/notes/:note', name: 'note', component: page('note'), props: route => ({ noteId: route.params.note }) },
		{ path: '/tags/:tag', component: page('tag'), props: route => ({ tag: route.params.tag }) },
		{ path: '/games/reversi', component: page('reversi/index') },
		{ path: '/games/reversi/:gameId', component: page('reversi/game'), props: route => ({ gameId: route.params.gameId }) },
		{ path: '/mfm-cheat-sheet', component: page('mfm-cheat-sheet') },
		{ path: '/api-console', component: page('api-console') },
		{ path: '/test', component: page('test') },
		{ path: '/auth/:token', component: page('auth') },
		{ path: '/miauth/:session', component: page('miauth') },
		{ path: '/authorize-follow', component: page('follow') },
		{ path: '/share', component: page('share') },
		{ path: '/test', component: page('test') },
		{ path: '/:catchAll(.*)', component: page('not-found') }
	],
	// なんかHacky
	// 通常の使い方をすると scroll メソッドの behavior を設定できないため、自前で window.scroll するようにする
	scrollBehavior(to) {
		window._scroll = () => { // さらにHacky
			if (to.name === 'index') {
				window.scroll({ top: indexScrollPos, behavior: 'instant' });
				const i = setInterval(() => {
					window.scroll({ top: indexScrollPos, behavior: 'instant' });
				}, 10);
				setTimeout(() => {
					clearInterval(i);
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
