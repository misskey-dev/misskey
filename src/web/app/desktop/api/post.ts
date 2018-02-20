import PostFormWindow from '../views/components/post-form-window.vue';

export default function() {
	const vm = new PostFormWindow().$mount();
	document.body.appendChild(vm.$el);
}
