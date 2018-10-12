import PostForm from '../views/components/post-form-dialog.vue';

export default (os) => (opts) => {
	const o = opts || {};

	document.documentElement.style.overflow = 'hidden';

	function recover() {
		document.documentElement.style.overflow = 'auto';
	}

	const vm = new PostForm({
		parent: os.app,
		propsData: {
			reply: o.reply,
			renote: o.renote
		}
	}).$mount();
	vm.$once('cancel', recover);
	vm.$once('posted', recover);
	if (opts.cb) vm.$once('closed', opts.cb);
	document.body.appendChild(vm.$el);
	(vm as any).focus();
};
