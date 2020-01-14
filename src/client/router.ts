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
		{ path: '/featured', component: () => import('./pages/featured.vue').then(m => m.default) },
		{ path: '/search', component: () => import('./pages/search.vue').then(m => m.default) },
		{ path: '/favorites', component: () => import('./pages/favorites.vue').then(m => m.default) },
		{ path: '/messages', component: () => import('./pages/messages.vue').then(m => m.default) },
		{ path: '/settings', component: () => import('./pages/settings.vue').then(m => m.default) },
		{ path: '/instance', component: () => import('./pages/instance/index.vue').then(m => m.default) },
		{ path: '/instance/emojis', component: () => import('./pages/instance/emojis.vue').then(m => m.default) },
		{ path: '/instance/users', component: () => import('./pages/instance/users.vue').then(m => m.default) },
		{ path: '/instance/files', component: () => import('./pages/instance/files.vue').then(m => m.default) },
		{ path: '/instance/monitor', component: () => import('./pages/instance/monitor.vue').then(m => m.default) },
		{ path: '/instance/queue', component: () => import('./pages/instance/queue.vue').then(m => m.default) },
		{ path: '/instance/stats', component: () => import('./pages/instance/stats.vue').then(m => m.default) },
		{ path: '/instance/federation', component: () => import('./pages/instance/federation.vue').then(m => m.default) },
		{ path: '/instance/announcements', component: () => import('./pages/instance/announcements.vue').then(m => m.default) },
		{ path: '/follow-requests', component: () => import('./pages/follow-requests.vue').then(m => m.default) },
		{ path: '/manage-lists', component: () => import('./pages/manage-lists/index.vue').then(m => m.default) },
		{ path: '/manage-lists/:list', component: () => import('./pages/manage-lists/list.vue').then(m => m.default) },
		{ path: '/lists/:list', component: () => import('./pages/list.vue').then(m => m.default) },
		{ path: '/notes/:note', name: 'note', component: () => import('./pages/note.vue').then(m => m.default) },
		{ path: '/tags/:tag', component: () => import('./pages/tag.vue').then(m => m.default) },
		{ path: '/authorize-follow', component: () => import('./pages/follow.vue').then(m => m.default) },
		/*{ path: '*', component: MkNotFound }*/
	]
});
