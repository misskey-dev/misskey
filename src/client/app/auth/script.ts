/**
 * Authorize Form
 */

import VueRouter from 'vue-router';

// Style
import './style.styl';

import init from '../init';
import Index from './views/index.vue';
import * as config from '../config';

/**
 * init
 */
init(launch => {
	document.title = `${config.name} | %i18n:common.application-authorization%`;

	// Init router
	const router = new VueRouter({
		mode: 'history',
		base: '/auth/',
		routes: [
			{ path: '/:token', component: Index },
		]
	});

	// Launch the app
	launch(router);
});
