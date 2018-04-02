import PostForm from '../views/components/post-form.vue';
//import RepostForm from '../views/components/repost-form.vue';
import getPostSummary from '../../../../get-post-summary';

export default (os) => (opts) => {
	const o = opts || {};

	if (o.repost) {
		/*const vm = new RepostForm({
			propsData: {
				repost: o.repost
			}
		}).$mount();
		vm.$once('cancel', recover);
		vm.$once('post', recover);
		document.body.appendChild(vm.$el);*/

		const text = window.prompt(`「${getPostSummary(o.repost)}」をRepost`);
		if (text == null) return;
		os.api('posts/create', {
			repostId: o.repost.id,
			text: text == '' ? undefined : text
		});
	} else {
		const app = document.getElementById('app');
		app.style.display = 'none';

		function recover() {
			app.style.display = 'block';
		}

		const vm = new PostForm({
			parent: os.app,
			propsData: {
				reply: o.reply
			}
		}).$mount();
		vm.$once('cancel', recover);
		vm.$once('post', recover);
		document.body.appendChild(vm.$el);
		(vm as any).focus();
	}
};
