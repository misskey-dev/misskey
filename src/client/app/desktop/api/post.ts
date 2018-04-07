import PostFormWindow from '../views/components/post-form-window.vue';
import RenoteFormWindow from '../views/components/renote-form-window.vue';

export default function(opts) {
	const o = opts || {};
	if (o.renote) {
		const vm = new RenoteFormWindow({
			propsData: {
				renote: o.renote
			}
		}).$mount();
		document.body.appendChild(vm.$el);
	} else {
		const vm = new PostFormWindow({
			propsData: {
				reply: o.reply
			}
		}).$mount();
		document.body.appendChild(vm.$el);
	}
}
