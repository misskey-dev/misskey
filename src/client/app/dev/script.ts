/**
 * Developer Center
 */

import Vue from 'vue';
import VueRouter from 'vue-router';
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
	// Init router
	const router = new VueRouter({
		mode: 'history',
		base: '/dev/',
		routes: [
			{ path: '/', component: Index },
			{ path: '/apps', component: Apps },
			{ path: '/app/new', component: AppNew },
			{ path: '/app/:id', component: App },
		]
	});

	// Launch the app
	launch(router);
});
