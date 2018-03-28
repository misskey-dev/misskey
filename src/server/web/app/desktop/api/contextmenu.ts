import Ctx from '../views/components/context-menu.vue';

export default function(e, menu, opts?) {
	const o = opts || {};
	const vm = new Ctx({
		propsData: {
			menu,
			x: e.pageX - window.pageXOffset,
			y: e.pageY - window.pageYOffset,
		}
	}).$mount();
	vm.$once('closed', () => {
		if (o.closed) o.closed();
	});
	document.body.appendChild(vm.$el);
}
