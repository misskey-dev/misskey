import * as riot from 'riot';
const route = require('page');
let page = null;

export default me => {
	route('/',         index);
	route('/:channel', channel);
	route('*',         notFound);

	function index() {
		mount(document.createElement('mk-index'));
	}

	function channel(ctx) {
		const el = document.createElement('mk-channel');
		el.setAttribute('id', ctx.params.channel);
		mount(el);
	}

	function notFound() {
		mount(document.createElement('mk-not-found'));
	}

	// EXEC
	route();
};

function mount(content) {
	if (page) page.unmount();
	const body = document.getElementById('app');
	page = riot.mount(body.appendChild(content))[0];
}
