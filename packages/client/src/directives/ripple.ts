import Ripple from '@/components/MkRipple.vue';
import { popup } from '@/os';

export default {
	mounted(el, binding, vn) {
		// 明示的に false であればバインドしない
		if (binding.value === false) return;

		el.addEventListener('click', () => {
			const rect = el.getBoundingClientRect();

			const x = rect.left + (el.offsetWidth / 2);
			const y = rect.top + (el.offsetHeight / 2);

			popup(Ripple, { x, y }, {}, 'end');
		});
	}
};
