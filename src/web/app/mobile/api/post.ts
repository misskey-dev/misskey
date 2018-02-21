
export default opts => {
	const app = document.getElementById('app');
	app.style.display = 'none';

	function recover() {
		app.style.display = 'block';
	}

	const form = riot.mount(document.body.appendChild(document.createElement('mk-post-form')), opts)[0];
	form
		.on('cancel', recover)
		.on('post', recover);
};
