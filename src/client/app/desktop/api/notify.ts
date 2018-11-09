import Notification from '../views/components/ui-notification.vue';

export default (ne: Function) => message => {
	const vm = ne(Notification, {
		message
	});
	document.body.appendChild(vm.$el);
};
