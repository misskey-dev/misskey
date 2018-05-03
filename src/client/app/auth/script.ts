/**
 * Authorize Form
 */

import VueRouter from 'vue-router';

// Style
import './style.styl';

import init from '../init';

import Index from './views/index.vue';

/**
 * init
 */
init(launch => {
	document.title = 'Misskey | アプリの連携';

	// Init router
	const router = new VueRouter({
		mode: 'history',
		routes: [
			{ path: '/:token', component: Index },
		]
	});

	// Launch the app
	launch(router);
});
