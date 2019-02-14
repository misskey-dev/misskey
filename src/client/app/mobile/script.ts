/**
 * Mobile Client
 */

import Vue from 'vue';
import VueRouter from 'vue-router';

// Style
import './style.styl';

import init from '../init';

import MkIndex from './views/pages/index.vue';
import MkSignup from './views/pages/signup.vue';
import MkSelectDrive from './views/pages/selectdrive.vue';
import MkDrive from './views/pages/drive.vue';
import MkNotifications from './views/pages/notifications.vue';
import MkWidgets from './views/pages/widgets.vue';
import MkMessaging from './views/pages/messaging.vue';
import MkMessagingRoom from './views/pages/messaging-room.vue';
import MkReceivedFollowRequests from './views/pages/received-follow-requests.vue';
import MkNote from './views/pages/note.vue';
import MkSearch from './views/pages/search.vue';
import MkFollowers from './views/pages/followers.vue';
import MkFollowing from './views/pages/following.vue';
import MkFavorites from './views/pages/favorites.vue';
import MkUserLists from './views/pages/user-lists.vue';
import MkUserList from './views/pages/user-list.vue';
import MkReversi from './views/pages/games/reversi.vue';
import MkTag from './views/pages/tag.vue';
import MkShare from './views/pages/share.vue';
import MkFollow from '../common/views/pages/follow.vue';
import MkNotFound from '../common/views/pages/not-found.vue';

import PostForm from './views/components/post-form-dialog.vue';
import FileChooser from './views/components/drive-file-chooser.vue';
import FolderChooser from './views/components/drive-folder-chooser.vue';

/**
 * init
 */
init((launch) => {
	Vue.mixin({
		data() {
			return {
				isMobile: true
			};
		},

		methods: {
			$post(opts) {
				const o = opts || {};

				document.documentElement.style.overflow = 'hidden';

				function recover() {
					document.documentElement.style.overflow = 'auto';
				}

				const vm = this.$root.new(PostForm, {
					reply: o.reply,
					mention: o.mention,
					renote: o.renote
				});

				vm.$once('cancel', recover);
				vm.$once('posted', recover);
				if (o.cb) vm.$once('closed', o.cb);
				(vm as any).focus();
			},

			$chooseDriveFile(opts) {
				return new Promise((res, rej) => {
					const o = opts || {};
					const vm = this.$root.new(FileChooser, {
						title: o.title,
						multiple: o.multiple,
						initFolder: o.currentFolder
					});
					vm.$once('selected', file => {
						res(file);
					});
				});
			},

			$chooseDriveFolder(opts) {
				return new Promise((res, rej) => {
					const o = opts || {};
					const vm = this.$root.new(FolderChooser, {
						title: o.title,
						initFolder: o.currentFolder
					});
					vm.$once('selected', folder => {
						res(folder);
					});
				});
			},

			$notify(message) {
				alert(message);
			}
		}
	});

	// Register directives
	require('./views/directives');

	// Register components
	require('./views/components');
	require('./views/widgets');

	// http://qiita.com/junya/items/3ff380878f26ca447f85
	document.body.setAttribute('ontouchstart', '');

	// Init router
	const router = new VueRouter({
		mode: 'history',
		routes: [
			{ path: '/', name: 'index', component: MkIndex },
			{ path: '/signup', name: 'signup', component: MkSignup },
			{ path: '/i/settings', name: 'settings', component: () => import('./views/pages/settings.vue').then(m => m.default) },
			{ path: '/i/notifications', name: 'notifications', component: MkNotifications },
			{ path: '/i/favorites', name: 'favorites', component: MkFavorites },
			{ path: '/i/lists', name: 'user-lists', component: MkUserLists },
			{ path: '/i/lists/:list', name: 'user-list', component: MkUserList },
			{ path: '/i/received-follow-requests', name: 'received-follow-requests', component: MkReceivedFollowRequests },
			{ path: '/i/widgets', name: 'widgets', component: MkWidgets },
			{ path: '/i/messaging', name: 'messaging', component: MkMessaging },
			{ path: '/i/messaging/:user', component: MkMessagingRoom },
			{ path: '/i/drive', name: 'drive', component: MkDrive },
			{ path: '/i/drive/folder/:folder', component: MkDrive },
			{ path: '/i/drive/file/:file', component: MkDrive },
			{ path: '/selectdrive', component: MkSelectDrive },
			{ path: '/search', component: MkSearch },
			{ path: '/tags/:tag', component: MkTag },
			{ path: '/featured', name: 'featured', component: () => import('./views/pages/featured.vue').then(m => m.default) },
			{ path: '/share', component: MkShare },
			{ path: '/games/reversi/:game?', name: 'reversi', component: MkReversi },
			{ path: '/@:user', component: () => import('./views/pages/user.vue').then(m => m.default) },
			{ path: '/@:user/followers', component: MkFollowers },
			{ path: '/@:user/following', component: MkFollowing },
			{ path: '/notes/:note', component: MkNote },
			{ path: '/authorize-follow', component: MkFollow },
			{ path: '*', component: MkNotFound }
		]
	});

	// Launch the app
	launch(router);
}, true);
