/**
 * Developer Center
 */

import Vue from 'vue';
import BootstrapVue from 'bootstrap-vue';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

// Style
import './style.styl';

import init from '../init';

import Index from './views/index.vue';
import Apps from './views/apps.vue';
import AppNew from './views/new-app.vue';
import App from './views/app.vue';
import ui from './views/ui.vue';

Vue.use(BootstrapVue);

Vue.component('mk-ui', ui);

/**
 * init
 */
init(launch => {
	// Launch the app
	const [app] = launch();

	// Routing
	app.$router.addRoutes([
		{ path: '/', component: Index },
		{ path: '/apps', component: Apps },
		{ path: '/app/new', component: AppNew },
		{ path: '/app/:id', component: App },
	]);
});
