import * as riot from 'riot';
import * as route from 'page';
let page = null;

export default () => {
	route('/',         index);
	route('/apps',     apps);
	route('/app/new',  newApp);
	route('/app/:app', app);
	route('*',         notFound);

	function index() {
		mount(document.createElement('mk-index'));
	}

	function apps() {
		mount(document.createElement('mk-apps-page'));
	}

	function newApp() {
		mount(document.createElement('mk-new-app-page'));
	}

	function app(ctx) {
		const el = document.createElement('mk-app-page');
		el.setAttribute('app', ctx.params.app);
		mount(el);
	}

	function notFound() {
		mount(document.createElement('mk-not-found'));
	}

	// EXEC
	(route as any)();
};

function mount(content) {
	if (page) page.unmount();
	const body = document.getElementById('app');
	page = riot.mount(body.appendChild(content))[0];
}
