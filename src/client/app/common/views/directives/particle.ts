import Particle from '../components/particle.vue';

export default {
	bind(el, binding, vn) {
		if (vn.context.$store.state.device.reduceMotion) return;

		el.addEventListener('click', () => {
			if (binding.value === false) return;

			const rect = el.getBoundingClientRect();

			const x = rect.left + (el.clientWidth / 2);
			const y = rect.top + (el.clientHeight / 2);

			const particle = new Particle({
				parent: vn.context,
				propsData: {
					x,
					y
				}
			}).$mount();

			document.body.appendChild(particle.$el);
		});
	}
};
