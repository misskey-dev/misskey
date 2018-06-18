import OS from '../../mios';
import Notification from '../views/components/ui-notification.vue';

export default (os: OS) => message => {
	const vm = os.new(Notification, {
		message
	});
	document.body.appendChild(vm.$el);
};
