/**
 * Mobile Client
 */

import VueRouter from 'vue-router';

// Style
import './style.styl';

import init from '../init';

import chooseDriveFolder from './api/choose-drive-folder';
import chooseDriveFile from './api/choose-drive-file';
import dialog from './api/dialog';
import input from './api/input';
import post from './api/post';
import notify from './api/notify';

import MkIndex from './views/pages/index.vue';
import MkSignup from './views/pages/signup.vue';
import MkUser from './views/pages/user.vue';
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
import MkSettings from './views/pages/settings.vue';
import MkReversi from './views/pages/games/reversi.vue';
import MkTag from './views/pages/tag.vue';
import MkShare from './views/pages/share.vue';
import MkFollow from '../common/views/pages/follow.vue';

/**
 * init
 */
init((launch) => {
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
			{ path: '/i/settings', name: 'settings', component: MkSettings },
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
			{ path: '/share', component: MkShare },
			{ path: '/reversi/:game?', name: 'reversi', component: MkReversi },
			{ path: '/@:user', component: MkUser },
			{ path: '/@:user/followers', component: MkFollowers },
			{ path: '/@:user/following', component: MkFollowing },
			{ path: '/notes/:note', component: MkNote },
			{ path: '/authorize-follow', component: MkFollow }
		]
	});

	// Launch the app
	launch(router, os => ({
		chooseDriveFolder,
		chooseDriveFile,
		dialog: dialog(os),
		input,
		post: post(os),
		notify
	}));
}, true);
