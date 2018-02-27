/**
 * Developer Center
 */

// Style
import './style.styl';

import init from '../init';

import Index from './views/index.vue';
import Apps from './views/apps.vue';
import AppNew from './views/new-app.vue';
import App from './views/app.vue';

/**
 * init
 */
init(launch => {
	// Launch the app
	const [app] = launch();

	// Routing
	app.$router.addRoutes([
		{ path: '/', component: Index },
		{ path: '/app', component: Apps },
		{ path: '/app/new', component: AppNew },
		{ path: '/app/:id', component: App },
	]);
});
