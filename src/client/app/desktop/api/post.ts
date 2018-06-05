import OS from '../../mios';
import PostFormWindow from '../views/components/post-form-window.vue';
import RenoteFormWindow from '../views/components/renote-form-window.vue';

export default (os: OS) => opts => {
	const o = opts || {};
	if (o.renote) {
		const vm = os.new(RenoteFormWindow, {
			note: o.renote
		});
		document.body.appendChild(vm.$el);
	} else {
		const vm = os.new(PostFormWindow, {
			reply: o.reply
		});
		document.body.appendChild(vm.$el);
	}
};
