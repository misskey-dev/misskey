import OS from '../../mios';
import PostFormWindow from '../views/components/post-form-window.vue';
import RenoteFormWindow from '../views/components/renote-form-window.vue';

export default (os: OS) => opts => {
	const o = opts || {};
	if (o.renote) {
		const vm = os.new(RenoteFormWindow, {
			note: o.renote,
			animation: o.animation == null ? true : o.animation
		});
		if (o.cb) vm.$once('closed', o.cb);
		document.body.appendChild(vm.$el);
	} else {
		const vm = os.new(PostFormWindow, {
			reply: o.reply,
			animation: o.animation == null ? true : o.animation
		});
		if (o.cb) vm.$once('closed', o.cb);
		document.body.appendChild(vm.$el);
	}
};
