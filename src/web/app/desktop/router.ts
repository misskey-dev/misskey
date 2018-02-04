/**
 * Desktop App Router
 */

import * as riot from 'riot';
import * as route from 'page';
import MiOS from '../common/mios';
let page = null;

export default (mios: MiOS) => {
	route('/',                       index);
	route('/selectdrive',            selectDrive);
	route('/i/customize-home',       customizeHome);
	route('/i/drive',                drive);
	route('/i/drive/folder/:folder', drive);
	route('/i/messaging/:user',      messaging);
	route('/i/mentions',             mentions);
	route('/post::post',             post);
	route('/search',                 search);
	route('/:user',                  user.bind(null, 'home'));
	route('/:user/graphs',           user.bind(null, 'graphs'));
	route('/:user/:post',            post);
	route('*',                       notFound);

	function index() {
		mios.isSignedin ? home() : entrance();
	}

	function home() {
		mount(document.createElement('mk-home-page'));
	}

	function customizeHome() {
		mount(document.createElement('mk-home-customize-page'));
	}

	function entrance() {
		mount(document.createElement('mk-entrance'));
		document.documentElement.setAttribute('data-page', 'entrance');
	}

	function mentions() {
		const el = document.createElement('mk-home-page');
		el.setAttribute('mode', 'mentions');
		mount(el);
	}

	function search(ctx) {
		const el = document.createElement('mk-search-page');
		el.setAttribute('query', ctx.querystring.substr(2));
		mount(el);
	}

	function user(page, ctx) {
		const el = document.createElement('mk-user-page');
		el.setAttribute('user', ctx.params.user);
		el.setAttribute('page', page);
		mount(el);
	}

	function post(ctx) {
		const el = document.createElement('mk-post-page');
		el.setAttribute('post', ctx.params.post);
		mount(el);
	}

	function selectDrive() {
		mount(document.createElement('mk-selectdrive-page'));
	}

	function drive(ctx) {
		const el = document.createElement('mk-drive-page');
		if (ctx.params.folder) el.setAttribute('folder', ctx.params.folder);
		mount(el);
	}

	function messaging(ctx) {
		const el = document.createElement('mk-messaging-room-page');
		el.setAttribute('user', ctx.params.user);
		mount(el);
	}

	function notFound() {
		mount(document.createElement('mk-not-found'));
	}

	(riot as any).mixin('page', {
		page: route
	});

	// EXEC
	(route as any)();
};

function mount(content) {
	document.documentElement.removeAttribute('data-page');
	if (page) page.unmount();
	const body = document.getElementById('app');
	page = riot.mount(body.appendChild(content))[0];
}
