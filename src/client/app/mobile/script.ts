/**
 * Mobile Client
 */

import VueRouter from 'vue-router';

// Style
import './style.styl';
import '../../element.scss';

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
import MkMessaging from './views/pages/messaging.vue';
import MkMessagingRoom from './views/pages/messaging-room.vue';
import MkNote from './views/pages/note.vue';
import MkSearch from './views/pages/search.vue';
import MkFollowers from './views/pages/followers.vue';
import MkFollowing from './views/pages/following.vue';
import MkSettings from './views/pages/settings.vue';
import MkProfileSetting from './views/pages/profile-setting.vue';
import MkOthello from './views/pages/othello.vue';

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
			{ path: '/i/settings', component: MkSettings },
			{ path: '/i/settings/profile', component: MkProfileSetting },
			{ path: '/i/notifications', component: MkNotifications },
			{ path: '/i/messaging', component: MkMessaging },
			{ path: '/i/messaging/:user', component: MkMessagingRoom },
			{ path: '/i/drive', component: MkDrive },
			{ path: '/i/drive/folder/:folder', component: MkDrive },
			{ path: '/i/drive/file/:file', component: MkDrive },
			{ path: '/selectdrive', component: MkSelectDrive },
			{ path: '/search', component: MkSearch },
			{ path: '/othello', component: MkOthello },
			{ path: '/othello/:game', component: MkOthello },
			{ path: '/@:user', component: MkUser },
			{ path: '/@:user/followers', component: MkFollowers },
			{ path: '/@:user/following', component: MkFollowing },
			{ path: '/notes/:note', component: MkNote }
		]
	});

	// Launch the app
	launch(router, os => ({
		chooseDriveFolder,
		chooseDriveFile,
		dialog,
		input,
		post: post(os),
		notify
	}));
}, true);
