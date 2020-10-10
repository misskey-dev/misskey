import { defineAsyncComponent } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import MkLoading from '@/pages/_loading_.vue';
import MkError from '@/pages/_error_.vue';
import TimelinePage from '@/pages/timeline.vue';
import WelcomePage from '@/pages/welcome.vue';
import { store } from './store';

const page = (path: string) => defineAsyncComponent({
	loader: () => import(`./pages/${path}.vue`),
	loadingComponent: MkLoading,
	errorComponent: MkError,
});

let indexScrollPos = 0;

export const router = createRouter({
	history: createWebHistory(),
	routes: [
		{ path: '/', name: 'index', component: store.getters.isSignedIn ? TimelinePage : WelcomePage },
		{ path: '/@:user', name: 'user', component: page('user/index'), children: [
			{ path: 'following', name: 'userFollowing', component: page('user/follow-list'), props: { type: 'following' } },
			{ path: 'followers', name: 'userFollowers', component: page('user/follow-list'), props: { type: 'followers' } },
		]},
		{ path: '/@:user/pages/:page', component: page('page'), props: route => ({ pageName: route.params.page, username: route.params.user }) },
		{ path: '/@:user/pages/:pageName/view-source', component: page('page-editor/page-editor'), props: route => ({ initUser: route.params.user, initPageName: route.params.pageName }) },
		{ path: '/@:acct/room', props: true, component: page('room/room') },
		{ path: '/settings', name: 'settings', component: page('settings/index'), children: [
			{ path: 'profile', component: page('settings/profile') },
			{ path: 'privacy', component: page('settings/privacy') },
			{ path: 'reaction', component: page('settings/reaction') },
			{ path: 'notifications', component: page('settings/notifications') },
			{ path: 'mute-block', component: page('settings/mute-block') },
			{ path: 'word-mute', component: page('settings/word-mute') },
			{ path: 'integration', component: page('settings/integration') },
			{ path: 'security', component: page('settings/security') },
			{ path: 'api', component: page('settings/api') },
			{ path: 'other', component: page('settings/other') },
			{ path: 'general', component: page('settings/general') },
			{ path: 'theme', component: page('settings/theme') },
			{ path: 'sidebar', component: page('settings/sidebar') },
			{ path: 'sounds', component: page('settings/sounds') },
			{ path: 'plugins', component: page('settings/plugins') },
		]},
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
		{ path: '/channels', component: page('channels') },
		{ path: '/channels/new', component: page('channel-editor') },
		{ path: '/channels/:channelId/edit', component: page('channel-editor'), props: true },
		{ path: '/channels/:channelId', component: page('channel'), props: true },
		{ path: '/my/notifications', component: page('notifications') },
		{ path: '/my/favorites', component: page('favorites') },
		{ path: '/my/messages', component: page('messages') },
		{ path: '/my/mentions', component: page('mentions') },
		{ path: '/my/messaging', name: 'messaging', component: page('messaging/index') },
		{ path: '/my/messaging/:user', component: page('messaging/messaging-room') },
		{ path: '/my/messaging/group/:group', component: page('messaging/messaging-room') },
		{ path: '/my/drive', name: 'drive', component: page('drive') },
		{ path: '/my/drive/folder/:folder', component: page('drive') },
		{ path: '/my/pages', name: 'pages', component: page('pages') },
		{ path: '/my/pages/new', component: page('page-editor/page-editor') },
		{ path: '/my/pages/edit/:pageId', component: page('page-editor/page-editor'), props: route => ({ initPageId: route.params.pageId }) },
		{ path: '/my/follow-requests', component: page('follow-requests') },
		{ path: '/my/lists', component: page('my-lists/index') },
		{ path: '/my/lists/:list', component: page('my-lists/list') },
		{ path: '/my/groups', component: page('my-groups/index') },
		{ path: '/my/groups/:group', component: page('my-groups/group') },
		{ path: '/my/antennas', component: page('my-antennas/index') },
		{ path: '/my/apps', component: page('apps') },
		{ path: '/scratchpad', component: page('scratchpad') },
		{ path: '/instance', component: page('instance/index') },
		{ path: '/instance/emojis', component: page('instance/emojis') },
		{ path: '/instance/users', component: page('instance/users') },
		{ path: '/instance/files', component: page('instance/files') },
		{ path: '/instance/queue', component: page('instance/queue') },
		{ path: '/instance/settings', component: page('instance/settings') },
		{ path: '/instance/federation', component: page('instance/federation') },
		{ path: '/instance/relays', component: page('instance/relays') },
		{ path: '/instance/announcements', component: page('instance/announcements') },
		{ path: '/notes/:note', name: 'note', component: page('note') },
		{ path: '/tags/:tag', component: page('tag') },
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
