import { Directive } from 'vue';

//const observers = new Map<Element, ResizeObserver>();

export default {
	mounted(el, binding, vn) {
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

		// Vue3では使えなくなった
		// 無くても大丈夫か...？
		//vn.context.$on('hook:activated', calc);

		const ro = new ResizeObserver((entries, observer) => {
			calc();
		});

		ro.observe(el);

		// TODO: 新たにプロパティを作るのをやめMapを使う
		// ただメモリ的には↓の方が省メモリかもしれないので検討中
		el._ro_ = ro;
	},

	unmounted(el, binding, vn) {
		el._ro_.unobserve(el);
	}
} as Directive;
