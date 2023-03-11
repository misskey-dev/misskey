import { Directive } from 'vue';

const map = new WeakMap<HTMLElement, ResizeObserver>();

export default {
	mounted(el: HTMLElement, binding, vn) {
		const ro = new ResizeObserver((entries, observer) => {
			el.style.setProperty('--containerHeight', el.offsetHeight + 'px');
		});
		ro.observe(el);
		map.set(el, ro);
	},

	unmounted(el, binding, vn) {
		const ro = map.get(el);
		if (ro) {
			ro.disconnect();
			map.delete(el);
		}
	},
} as Directive;
