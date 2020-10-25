import { Directive } from 'vue';

export default {
	mounted(src, binding, vn) {
		const fn = binding.value;
		if (fn == null) return;

		const observer = new IntersectionObserver(entries => {
			if (entries.some(entry => entry.isIntersecting)) {
				fn();
			}
		});

		observer.observe(src);

		src._observer_ = observer;
	},

	unmounted(src, binding, vn) {
		if (src._observer_) src._observer_.disconnect();
	}
} as Directive;
