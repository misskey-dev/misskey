import Particle from '@/components/particle.vue';
import { popup } from '@/os';

export default {
	mounted(el, binding, vn) {
		// 明示的に false であればバインドしない
		if (binding.value === false) return;

		el.addEventListener('click', () => {
			const rect = el.getBoundingClientRect();

			const x = rect.left + (el.clientWidth / 2);
			const y = rect.top + (el.clientHeight / 2);

			popup(Particle, { x, y });
		});
	}
};
