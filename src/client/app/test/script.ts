import VueRouter from 'vue-router';

// Style
import './style.styl';

import init from '../init';
import Index from './views/index.vue';
import NotFound from '../common/views/pages/not-found.vue';

init(launch => {
	document.title = 'Misskey';

	// Init router
	const router = new VueRouter({
		mode: 'history',
		base: '/test/',
		routes: [
			{ path: '/', component: Index },
			{ path: '*', component: NotFound }
		]
	});

	// Launch the app
	launch(router);
});
