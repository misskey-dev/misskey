import PostFormWindow from '../views/components/post-form-window.vue';
import RepostFormWindow from '../views/components/repost-form-window.vue';

export default function(opts) {
	const o = opts || {};
	if (o.repost) {
		const vm = new RepostFormWindow({
			propsData: {
				repost: o.repost
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
