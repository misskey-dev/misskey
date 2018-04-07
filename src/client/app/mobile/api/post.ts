import PostForm from '../views/components/post-form.vue';
//import RenoteForm from '../views/components/renote-form.vue';
import getNoteSummary from '../../../../renderers/get-note-summary';

export default (os) => (opts) => {
	const o = opts || {};

	if (o.renote) {
		/*const vm = new RenoteForm({
			propsData: {
				renote: o.renote
			}
		}).$mount();
		vm.$once('cancel', recover);
		vm.$once('note', recover);
		document.body.appendChild(vm.$el);*/

		const text = window.prompt(`「${getNoteSummary(o.renote)}」をRenote`);
		if (text == null) return;
		os.api('notes/create', {
			renoteId: o.renote.id,
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
		vm.$once('note', recover);
		document.body.appendChild(vm.$el);
		(vm as any).focus();
	}
};
