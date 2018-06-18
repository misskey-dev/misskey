import OS from '../../mios';
import Ctx from '../views/components/context-menu.vue';

export default (os: OS) => (e, menu, opts?) => {
	const o = opts || {};
	const vm = os.new(Ctx, {
		menu,
		x: e.pageX - window.pageXOffset,
		y: e.pageY - window.pageYOffset,
	});
	vm.$once('closed', () => {
		if (o.closed) o.closed();
	});
	document.body.appendChild(vm.$el);
};
