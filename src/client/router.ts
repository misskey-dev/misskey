import Vue from 'vue';
import VueRouter from 'vue-router';
import MkIndex from './pages/index.vue';

Vue.use(VueRouter);

export const router = new VueRouter({
	mode: 'history',
	routes: [
		{ path: '/', name: 'index', component: MkIndex },
		{ path: '/@:user', name: 'user', component: () => import('./pages/user/index.vue').then(m => m.default), children: [
			{ path: 'following', name: 'userFollowing', component: () => import('./pages/user/follow-list.vue').then(m => m.default), props: { type: 'following' } },
			{ path: 'followers', name: 'userFollowers', component: () => import('./pages/user/follow-list.vue').then(m => m.default), props: { type: 'followers' } },
		]},
		{ path: '/@:user/pages/:page', component: () => import('./pages/page.vue').then(m => m.default), props: route => ({ pageName: route.params.page, username: route.params.user }) },
		{ path: '/@:user/pages/:pageName/view-source', component: () => import('./pages/page-editor/page-editor.vue').then(m => m.default), props: route => ({ initUser: route.params.user, initPageName: route.params.pageName }) },
		{ path: '/announcements', component: () => import('./pages/announcements.vue').then(m => m.default) },
		{ path: '/about', component: () => import('./pages/about.vue').then(m => m.default) },
		{ path: '/featured', component: () => import('./pages/featured.vue').then(m => m.default) },
		{ path: '/explore', component: () => import('./pages/explore.vue').then(m => m.default) },
		{ path: '/explore/tags/:tag', props: true, component: () => import('./pages/explore.vue').then(m => m.default) },
		{ path: '/search', component: () => import('./pages/search.vue').then(m => m.default) },
		{ path: '/my/favorites', component: () => import('./pages/favorites.vue').then(m => m.default) },
		{ path: '/my/messages', component: () => import('./pages/messages.vue').then(m => m.default) },
		{ path: '/my/mentions', component: () => import('./pages/mentions.vue').then(m => m.default) },
		{ path: '/my/messaging', name: 'messaging', component: () => import('./pages/messaging.vue').then(m => m.default) },
		{ path: '/my/messaging/:user', component: () => import('./pages/messaging-room.vue').then(m => m.default) },
		{ path: '/my/drive', name: 'drive', component: () => import('./pages/drive.vue').then(m => m.default) },
		{ path: '/my/drive/folder/:folder', component: () => import('./pages/drive.vue').then(m => m.default) },
		{ path: '/my/pages', name: 'pages', component: () => import('./pages/pages.vue').then(m => m.default) },
		{ path: '/my/pages/new', component: () => import('./pages/page-editor/page-editor.vue').then(m => m.default) },
		{ path: '/my/pages/edit/:pageId', component: () => import('./pages/page-editor/page-editor.vue').then(m => m.default), props: route => ({ initPageId: route.params.pageId }) },
		{ path: '/my/settings', component: () => import('./pages/settings/index.vue').then(m => m.default) },
		{ path: '/my/follow-requests', component: () => import('./pages/follow-requests.vue').then(m => m.default) },
		{ path: '/my/lists', component: () => import('./pages/my-lists/index.vue').then(m => m.default) },
		{ path: '/my/lists/:list', component: () => import('./pages/my-lists/list.vue').then(m => m.default) },
		{ path: '/my/antennas', component: () => import('./pages/my-antennas/index.vue').then(m => m.default) },
		{ path: '/instance', component: () => import('./pages/instance/index.vue').then(m => m.default) },
		{ path: '/instance/emojis', component: () => import('./pages/instance/emojis.vue').then(m => m.default) },
		{ path: '/instance/users', component: () => import('./pages/instance/users.vue').then(m => m.default) },
		{ path: '/instance/files', component: () => import('./pages/instance/files.vue').then(m => m.default) },
		{ path: '/instance/monitor', component: () => import('./pages/instance/monitor.vue').then(m => m.default) },
		{ path: '/instance/queue', component: () => import('./pages/instance/queue.vue').then(m => m.default) },
		{ path: '/instance/stats', component: () => import('./pages/instance/stats.vue').then(m => m.default) },
		{ path: '/instance/federation', component: () => import('./pages/instance/federation.vue').then(m => m.default) },
		{ path: '/instance/announcements', component: () => import('./pages/instance/announcements.vue').then(m => m.default) },
		{ path: '/notes/:note', name: 'note', component: () => import('./pages/note.vue').then(m => m.default) },
		{ path: '/tags/:tag', component: () => import('./pages/tag.vue').then(m => m.default) },
		{ path: '/auth/:token', component: () => import('./pages/auth.vue').then(m => m.default) },
		{ path: '/authorize-follow', component: () => import('./pages/follow.vue').then(m => m.default) },
		/*{ path: '*', component: MkNotFound }*/
	],
	// なんかバギー
	scrollBehavior(to, from, savedPosition) {
		if (savedPosition) {
			return savedPosition;
		} else {
			return { x: 0, y: 0 };
		}
	}
});
