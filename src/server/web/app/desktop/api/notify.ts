import Notification from '../views/components/ui-notification.vue';

export default function(message) {
	const vm = new Notification({
		propsData: {
			message
		}
	}).$mount();
	document.body.appendChild(vm.$el);
}
