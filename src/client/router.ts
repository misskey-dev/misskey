import Vue from 'vue';
import VueRouter from 'vue-router';
import MkIndex from './pages/index.vue';

Vue.use(VueRouter);

const page = (path: string) => () => import(`./pages/${path}.vue`).then(m => m.default);

let indexScrollPos = 0;

export const router = new VueRouter({
	mode: 'history',
	routes: [
		{ path: '/', name: 'index', component: MkIndex },
		{ path: '/@:user', name: 'user', component: page('user/index'), children: [
			{ path: 'following', name: 'userFollowing', component: page('user/follow-list'), props: { type: 'following' } },
			{ path: 'followers', name: 'userFollowers', component: page('user/follow-list'), props: { type: 'followers' } },
		]},
		{ path: '/@:user/pages/:page', component: page('page'), props: route => ({ pageName: route.params.page, username: route.params.user }) },
		{ path: '/@:user/pages/:pageName/view-source', component: page('page-editor/page-editor'), props: route => ({ initUser: route.params.user, initPageName: route.params.pageName }) },
		{ path: '/announcements', component: page('announcements') },
		{ path: '/about', component: page('about') },
		{ path: '/about-misskey', component: page('about-misskey') },
		{ path: '/featured', component: page('featured') },
		{ path: '/docs', component: page('docs') },
		{ path: '/docs/:doc', component: page('doc'), props: true },
		{ path: '/explore', component: page('explore') },
		{ path: '/explore/tags/:tag', props: true, component: page('explore') },
		{ path: '/search', component: page('search') },
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
		{ path: '/my/settings', component: page('my-settings/index') },
		{ path: '/my/follow-requests', component: page('follow-requests') },
		{ path: '/my/lists', component: page('my-lists/index') },
		{ path: '/my/lists/:list', component: page('my-lists/list') },
		{ path: '/my/groups', component: page('my-groups/index') },
		{ path: '/my/groups/:group', component: page('my-groups/group') },
		{ path: '/my/antennas', component: page('my-antennas/index') },
		{ path: '/my/apps', component: page('apps') },
		{ path: '/preferences', component: page('preferences/index') },
		{ path: '/instance', component: page('instance/index') },
		{ path: '/instance/emojis', component: page('instance/emojis') },
		{ path: '/instance/users', component: page('instance/users') },
		{ path: '/instance/files', component: page('instance/files') },
		{ path: '/instance/queue', component: page('instance/queue') },
		{ path: '/instance/settings', component: page('instance/settings') },
		{ path: '/instance/federation', component: page('instance/federation') },
		{ path: '/instance/announcements', component: page('instance/announcements') },
		{ path: '/notes/:note', name: 'note', component: page('note') },
		{ path: '/tags/:tag', component: page('tag') },
		{ path: '/auth/:token', component: page('auth') },
		{ path: '/miauth/:session', component: page('miauth') },
		{ path: '/authorize-follow', component: page('follow') },
		{ path: '/share', component: page('share') },
		{ path: '*', component: page('not-found') }
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
