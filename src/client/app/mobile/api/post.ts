import PostForm from '../views/components/post-form.vue';

export default (os) => (opts) => {
	const o = opts || {};

	const app = document.getElementById('app');
	app.style.display = 'none';

	function recover() {
		app.style.display = 'block';
	}

	const vm = new PostForm({
		parent: os.app,
		propsData: {
			reply: o.reply,
			renote: o.renote
		}
	}).$mount();
	vm.$once('cancel', recover);
	vm.$once('note', recover);
	document.body.appendChild(vm.$el);
	(vm as any).focus();
};
