/**
 * Desktop App Router
 */

import * as riot from 'riot';
const route = require('page');
let page = null;

export default me => {
	route('/',                 index);
	route('/selectdrive',      selectDrive);
	route('/i>mentions',       mentions);
	route('/channel',          channels);
	route('/channel/:channel', channel);
	route('/post::post',       post);
	route('/search::query',    search);
	route('/:user',            user.bind(null, 'home'));
	route('/:user/graphs',     user.bind(null, 'graphs'));
	route('/:user/:post',      post);
	route('*',                 notFound);

	function index() {
		me ? home() : entrance();
	}

	function home() {
		mount(document.createElement('mk-home-page'));
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
		el.setAttribute('query', ctx.params.query);
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

	function channel(ctx) {
		const el = document.createElement('mk-channel-page');
		el.setAttribute('id', ctx.params.channel);
		mount(el);
	}

	function channels() {
		mount(document.createElement('mk-channels-page'));
	}

	function selectDrive() {
		mount(document.createElement('mk-selectdrive-page'));
	}

	function notFound() {
		mount(document.createElement('mk-not-found'));
	}

	riot.mixin('page', {
		page: route
	});

	// EXEC
	route();
};

function mount(content) {
	document.documentElement.style.background = '#313a42';
	document.documentElement.removeAttribute('data-page');
	if (page) page.unmount();
	const body = document.getElementById('app');
	page = riot.mount(body.appendChild(content))[0];
}
