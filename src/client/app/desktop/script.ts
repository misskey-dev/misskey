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

import MkIndex from './views/pages/index.vue';
import MkHome from './views/pages/home.vue';
import MkDeck from './views/pages/deck/deck.vue';
import MkUser from './views/pages/user/user.vue';
import MkUserFollowingOrFollowers from './views/pages/user-following-or-followers.vue';
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

import Ctx from './views/components/context-menu.vue';
import PostFormWindow from './views/components/post-form-window.vue';
import RenoteFormWindow from './views/components/renote-form-window.vue';

import MiOS from '../mios';

/**
 * init
 */
init(async (launch) => {
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
						animation: o.animation == null ? true : o.animation
					});
					if (o.cb) vm.$once('closed', o.cb);
				}
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
			{ path: '/', name: 'index', component: MkIndex },
			{ path: '/home', name: 'home', component: MkHome },
			{ path: '/deck', name: 'deck', component: MkDeck },
			{ path: '/i/customize-home', component: MkHomeCustomize },
			{ path: '/i/favorites', component: MkFavorites },
			{ path: '/i/messaging/:user', component: MkMessagingRoom },
			{ path: '/i/drive', component: MkDrive },
			{ path: '/i/drive/folder/:folder', component: MkDrive },
			{ path: '/selectdrive', component: MkSelectDrive },
			{ path: '/search', component: MkSearch },
			{ path: '/tags/:tag', name: 'tag', component: MkTag },
			{ path: '/share', component: MkShare },
			{ path: '/reversi/:game?', component: MkReversi },
			{ path: '/@:user', name: 'user', component: MkUser },
			{ path: '/@:user/following', name: 'userFollowing', component: MkUserFollowingOrFollowers },
			{ path: '/@:user/followers', name: 'userFollowers', component: MkUserFollowingOrFollowers },
			{ path: '/notes/:note', name: 'note', component: MkNote },
			{ path: '/authorize-follow', component: MkFollow }
		]
	});

	// Launch the app
	const [, os] = launch(router);

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
