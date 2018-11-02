/**
 * Admin
 */

import VueRouter from 'vue-router';

// Style
import './style.styl';

import init from '../init';
import Index from './views/index.vue';

init(launch => {
	document.title = 'Admin';

	// Init router
	const router = new VueRouter({
		mode: 'history',
		base: '/admin/',
		routes: [
			{ path: '/', component: Index },
		]
	});

	// Launch the app
	launch(router);
});
