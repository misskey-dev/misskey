/**
 * Authorize Form
 */

// Style
import './style.styl';

import init from '../init';

import Index from './views/index.vue';

/**
 * init
 */
init(async (launch) => {
	document.title = 'Misskey | アプリの連携';

	// Launch the app
	const [app] = launch();

	// Routing
	app.$router.addRoutes([
		{ path: '/:token', component: Index },
	]);
});
