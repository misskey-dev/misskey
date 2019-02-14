/**
 * Desktop Client
 */

import Vue from 'vue';
import VueRouter from 'vue-router';

// Style
import './style.styl';

import init from '../init';
import fuckAdBlock from '../common/scripts/fuck-ad-block';
import composeNotification from '../common/scripts/compose-notification';

import MkHome from './views/home/home.vue';
import MkDeck from './views/deck/deck.vue';
import MkUserFollowingOrFollowers from './views/pages/user-following-or-followers.vue';
import MkSelectDrive from './views/pages/selectdrive.vue';
import MkDrive from './views/pages/drive.vue';
import MkMessagingRoom from './views/pages/messaging-room.vue';
import MkSearch from './views/pages/search.vue';
import MkReversi from './views/pages/games/reversi.vue';
import MkShare from './views/pages/share.vue';
import MkFollow from '../common/views/pages/follow.vue';
import MkNotFound from '../common/views/pages/not-found.vue';
import MkSettings from './views/pages/settings.vue';

import Ctx from './views/components/context-menu.vue';
import PostFormWindow from './views/components/post-form-window.vue';
import RenoteFormWindow from './views/components/renote-form-window.vue';
import MkChooseFileFromDriveWindow from './views/components/choose-file-from-drive-window.vue';
import MkChooseFolderFromDriveWindow from './views/components/choose-folder-from-drive-window.vue';
import MkHomeTimeline from './views/home/timeline.vue';
import Notification from './views/components/ui-notification.vue';

import { url } from '../config';
import MiOS from '../mios';

/**
 * init
 */
init(async (launch, os) => {
	Vue.mixin({
		methods: {
			$contextmenu(e, menu, opts?) {
				const o = opts || {};
				const vm = this.$root.new(Ctx, {
					menu,
					x: e.pageX - window.pageXOffset,
					y: e.pageY - window.pageYOffset,
				});
				vm.$once('closed', () => {
					if (o.closed) o.closed();
				});
			},

			$post(opts) {
				const o = opts || {};
				if (o.renote) {
					const vm = this.$root.new(RenoteFormWindow, {
						note: o.renote,
						animation: o.animation == null ? true : o.animation
					});
					if (o.cb) vm.$once('closed', o.cb);
				} else {
					const vm = this.$root.new(PostFormWindow, {
						reply: o.reply,
						mention: o.mention,
						animation: o.animation == null ? true : o.animation
					});
					if (o.cb) vm.$once('closed', o.cb);
				}
			},

			$chooseDriveFile(opts) {
				return new Promise((res, rej) => {
					const o = opts || {};

					if (document.body.clientWidth > 800) {
						const w = this.$root.new(MkChooseFileFromDriveWindow, {
							title: o.title,
							multiple: o.multiple,
							initFolder: o.currentFolder
						});
						w.$once('selected', file => {
							res(file);
						});
					} else {
						window['cb'] = file => {
							res(file);
						};

						window.open(url + `/selectdrive?multiple=${o.multiple}`,
							'choose_drive_window',
							'height=500, width=800');
					}
				});
			},

			$chooseDriveFolder(opts) {
				return new Promise((res, rej) => {
					const o = opts || {};
					const w = this.$root.new(MkChooseFolderFromDriveWindow, {
						title: o.title,
						initFolder: o.currentFolder
					});
					w.$once('selected', folder => {
						res(folder);
					});
				});
			},

			$notify(message) {
				this.$root.new(Notification, {
					message
				});
			}
		}
	});

	// Register directives
	require('./views/directives');

	// Register components
	require('./views/components');
	require('./views/widgets');

	// Init router
	const router = new VueRouter({
		mode: 'history',
		routes: [
			os.store.getters.isSignedIn && os.store.state.device.deckMode
				? { path: '/', name: 'index', component: MkDeck, children: [
					{ path: '/@:user', name: 'user', component: () => import('./views/deck/deck.user-column.vue').then(m => m.default) },
					{ path: '/notes/:note', name: 'note', component: () => import('./views/deck/deck.note-column.vue').then(m => m.default) },
					{ path: '/tags/:tag', name: 'tag', component: () => import('./views/deck/deck.hashtag-column.vue').then(m => m.default) },
					{ path: '/featured', component: () => import('./views/deck/deck.featured-column.vue').then(m => m.default) },
					{ path: '/i/favorites', component: () => import('./views/deck/deck.favorites-column.vue').then(m => m.default) }
				]}
				: { path: '/', component: MkHome, children: [
					{ path: '', name: 'index', component: MkHomeTimeline },
					{ path: '/@:user', name: 'user', component: () => import('./views/home/user/user.vue').then(m => m.default) },
					{ path: '/notes/:note', name: 'note', component: () => import('./views/home/note.vue').then(m => m.default) },
					{ path: '/tags/:tag', name: 'tag', component: () => import('./views/home/tag.vue').then(m => m.default) },
					{ path: '/featured', component: () => import('./views/home/featured.vue').then(m => m.default) },
					{ path: '/i/favorites', component: () => import('./views/home/favorites.vue').then(m => m.default) }
				]},
			{ path: '/i/messaging/:user', component: MkMessagingRoom },
			{ path: '/i/drive', component: MkDrive },
			{ path: '/i/drive/folder/:folder', component: MkDrive },
			{ path: '/i/settings', component: MkSettings },
			{ path: '/selectdrive', component: MkSelectDrive },
			{ path: '/search', component: MkSearch },
			{ path: '/share', component: MkShare },
			{ path: '/games/reversi/:game?', component: MkReversi },
			{ path: '/@:user/following', name: 'userFollowing', component: MkUserFollowingOrFollowers },
			{ path: '/@:user/followers', name: 'userFollowers', component: MkUserFollowingOrFollowers },
			{ path: '/authorize-follow', component: MkFollow },
			{ path: '*', component: MkNotFound }
		]
	});

	// Launch the app
	const [app, _] = launch(router);

	if (os.store.getters.isSignedIn) {
		/**
		 * Fuck AD Block
		 */
		fuckAdBlock(app);
	}

	/**
	 * Init Notification
	 */
	if ('Notification' in window && os.store.getters.isSignedIn) {
		// 許可を得ていなかったらリクエスト
		if ((Notification as any).permission == 'default') {
			await Notification.requestPermission();
		}

		if ((Notification as any).permission == 'granted') {
			registerNotifications(os);
		}
	}
}, true);

function registerNotifications(os: MiOS) {
	const stream = os.stream;

	if (stream == null) return;

	const connection = stream.useSharedConnection('main');

	connection.on('notification', notification => {
		const _n = composeNotification('notification', notification);
		const n = new Notification(_n.title, {
			body: _n.body,
			icon: _n.icon
		});
		setTimeout(n.close.bind(n), 6000);
	});

	connection.on('driveFileCreated', file => {
		const _n = composeNotification('driveFileCreated', file);
		const n = new Notification(_n.title, {
			body: _n.body,
			icon: _n.icon
		});
		setTimeout(n.close.bind(n), 5000);
	});

	connection.on('unreadMessagingMessage', message => {
		const _n = composeNotification('unreadMessagingMessage', message);
		const n = new Notification(_n.title, {
			body: _n.body,
			icon: _n.icon
		});
		n.onclick = () => {
			n.close();
			/*(riot as any).mount(document.body.appendChild(document.createElement('mk-messaging-room-window')), {
				user: message.user
			});*/
		};
		setTimeout(n.close.bind(n), 7000);
	});

	connection.on('reversiInvited', matching => {
		const _n = composeNotification('reversiInvited', matching);
		const n = new Notification(_n.title, {
			body: _n.body,
			icon: _n.icon
		});
	});
}
