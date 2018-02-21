/**
 * Mobile Client
 */

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

/**
 * init
 */
init((launch) => {
	// Register directives
	require('./views/directives');

	// Register components
	require('./views/components');

	// http://qiita.com/junya/items/3ff380878f26ca447f85
	document.body.setAttribute('ontouchstart', '');

	// Launch the app
	const [app] = launch(os => ({
		chooseDriveFolder,
		chooseDriveFile,
		dialog,
		input,
		post: post(os),
		notify
	}));

	// Routing
	app.$router.addRoutes([
		{ path: '/', name: 'index', component: MkIndex },
		{ path: '/signup', name: 'signup', component: MkSignup },
		{ path: '/i/drive', component: MkDrive },
		{ path: '/i/drive/folder/:folder', component: MkDrive },
		{ path: '/selectdrive', component: MkSelectDrive },
		{ path: '/:user', component: MkUser }
	]);
}, true);
