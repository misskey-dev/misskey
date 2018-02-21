import PostForm from '../views/components/post-form.vue';
import RepostForm from '../views/components/repost-form.vue';

export default function(opts) {
	const o = opts || {};

	const app = document.getElementById('app');
	app.style.display = 'none';

	function recover() {
		app.style.display = 'block';
	}

	if (o.repost) {
		const vm = new RepostForm({
			propsData: {
				repost: o.repost
			}
		}).$mount();
		vm.$once('cancel', recover);
		vm.$once('post', recover);
		document.body.appendChild(vm.$el);
	} else {
		const vm = new PostForm({
			propsData: {
				reply: o.reply
			}
		}).$mount();
		vm.$once('cancel', recover);
		vm.$once('post', recover);
		document.body.appendChild(vm.$el);
	}
}
