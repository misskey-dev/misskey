import { ResizeObserver } from '@juggle/resize-observer';

export default {
	inserted(el, binding, vn) {
		const query = binding.value;

		/*
		const addClassRecursive = (el: Element, cls: string) => {
			el.classList.add(cls);
			if (el.children) {
				for (const child of el.children) {
					addClassRecursive(child, cls);
				}
			}
		};

		const removeClassRecursive = (el: Element, cls: string) => {
			el.classList.remove(cls);
			if (el.children) {
				for (const child of el.children) {
					removeClassRecursive(child, cls);
				}
			}
		};*/

		const addClass = (el: Element, cls: string) => {
			el.classList.add(cls);
		};

		const removeClass = (el: Element, cls: string) => {
			el.classList.remove(cls);
		};

		const calc = () => {
			const width = el.clientWidth;

			for (const q of query) {
				if (q.max) {
					if (width <= q.max) {
						addClass(el, 'max-width_' + q.max + 'px');
					} else {
						removeClass(el, 'max-width_' + q.max + 'px');
					}
				}
				if (q.min) {
					if (width >= q.min) {
						addClass(el, 'min-width_' + q.min + 'px');
					} else {
						removeClass(el, 'min-width_' + q.min + 'px');
					}
				}
			}
		};

		calc();

		vn.context.$on('hook:activated', calc);

		const ro = new ResizeObserver((entries, observer) => {
			calc();
		});

		ro.observe(el);

		el._ro_ = ro;
	},

	unbind(el, binding, vn) {
		el._ro_.unobserve(el);
	}
};
