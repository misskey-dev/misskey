/**
 * Desktop Client
 */

import VueRouter from 'vue-router';

// Style
import './style.styl';

import init from '../init';
import fuckAdBlock from '../common/scripts/fuck-ad-block';
import { HomeStreamManager } from '../common/scripts/streaming/home';
import composeNotification from '../common/scripts/compose-notification';

import chooseDriveFolder from './api/choose-drive-folder';
import chooseDriveFile from './api/choose-drive-file';
import dialog from './api/dialog';
import input from './api/input';
import post from './api/post';
import notify from './api/notify';
import updateAvatar from './api/update-avatar';
import updateBanner from './api/update-banner';

import MkIndex from './views/pages/index.vue';
import MkDeck from './views/pages/deck/deck.vue';
import MkAdmin from './views/pages/admin/admin.vue';
import MkStats from './views/pages/stats/stats.vue';
import MkUser from './views/pages/user/user.vue';
import MkFavorites from './views/pages/favorites.vue';
import MkSelectDrive from './views/pages/selectdrive.vue';
import MkDrive from './views/pages/drive.vue';
import MkHomeCustomize from './views/pages/home-customize.vue';
import MkMessagingRoom from './views/pages/messaging-room.vue';
import MkNote from './views/pages/note.vue';
import MkSearch from './views/pages/search.vue';
import MkTag from './views/pages/tag.vue';
import MkReversi from './views/pages/games/reversi.vue';
import MkShare from './views/pages/share.vue';
import MkFollow from '../common/views/pages/follow.vue';

/**
 * init
 */
init(async (launch) => {
	// Register directives
	require('./views/directives');

	// Register components
	require('./views/components');
	require('./views/widgets');

	// Init router
	const router = new VueRouter({
		mode: 'history',
		routes: [
			{ path: '/', name: 'index', component: MkIndex },
			{ path: '/deck', name: 'deck', component: MkDeck },
			{ path: '/admin', name: 'admin', component: MkAdmin },
			{ path: '/stats', name: 'stats', component: MkStats },
			{ path: '/i/customize-home', component: MkHomeCustomize },
			{ path: '/i/favorites', component: MkFavorites },
			{ path: '/i/messaging/:user', component: MkMessagingRoom },
			{ path: '/i/drive', component: MkDrive },
			{ path: '/i/drive/folder/:folder', component: MkDrive },
			{ path: '/selectdrive', component: MkSelectDrive },
			{ path: '/search', component: MkSearch },
			{ path: '/tags/:tag', component: MkTag },
			{ path: '/share', component: MkShare },
			{ path: '/reversi/:game?', component: MkReversi },
			{ path: '/@:user', component: MkUser },
			{ path: '/notes/:note', component: MkNote },
			{ path: '/authorize-follow', component: MkFollow }
		]
	});

	// Launch the app
	const [, os] = launch(router, os => ({
		chooseDriveFolder: chooseDriveFolder(os),
		chooseDriveFile: chooseDriveFile(os),
		dialog: dialog(os),
		input: input(os),
		post: post(os),
		notify: notify(os),
		updateAvatar: updateAvatar(os),
		updateBanner: updateBanner(os)
	}));

	if (os.store.getters.isSignedIn) {
		/**
		 * Fuck AD Block
		 */
		fuckAdBlock(os);
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
			registerNotifications(os.stream);
		}
	}
}, true);

function registerNotifications(stream: HomeStreamManager) {
	if (stream == null) return;

	if (stream.hasConnection) {
		attach(stream.borrow());
	}

	stream.on('connected', connection => {
		attach(connection);
	});

	function attach(connection) {
		connection.on('notification', notification => {
			const _n = composeNotification('notification', notification);
			const n = new Notification(_n.title, {
				body: _n.body,
				icon: _n.icon
			});
			setTimeout(n.close.bind(n), 6000);
		});

		connection.on('drive_file_created', file => {
			const _n = composeNotification('drive_file_created', file);
			const n = new Notification(_n.title, {
				body: _n.body,
				icon: _n.icon
			});
			setTimeout(n.close.bind(n), 5000);
		});

		connection.on('unread_messaging_message', message => {
			const _n = composeNotification('unread_messaging_message', message);
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

		connection.on('reversi_invited', matching => {
			const _n = composeNotification('reversi_invited', matching);
			const n = new Notification(_n.title, {
				body: _n.body,
				icon: _n.icon
			});
		});
	}
}
